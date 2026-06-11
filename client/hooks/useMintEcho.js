import {useState, useEffect, useCallback} from 'react';
import {ethers} from 'ethers';
import {ABIs} from '../abi/index';
import echoMetadata from '/public/assets/nfts/echoes/echoesData.json';
import {
    useAppKitProvider,
    useAppKitAccount,
    useAppKitNetwork,
    useAppKit
} from '@reown/appkit/react';
import {activeNetwork} from '../appkitConfig';

export const useMintEcho = () => {
    const {address, isConnected} = useAppKitAccount();
    const {caipNetwork, switchNetwork} = useAppKitNetwork();
    const {walletProvider} = useAppKitProvider('eip155');
    const {open} = useAppKit();

    const [signer, setSigner] = useState(null);
    const [echoContract, setEchoContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [minting, setMinting] = useState(false);
    const [echos, setEchos] = useState([]);
    const [selectedEcho, setSelectedEcho] = useState(null);

    const isWrongNetwork = isConnected && Number(caipNetwork?.id) !== activeNetwork.id;
    const currentNetworkName = caipNetwork?.name || 'Unknown Network';
    const targetNetworkName = activeNetwork.name;

    const fetchAllEchoData = useCallback(async (contract, signerInstance) => {
        if (!contract || !signerInstance) return;

        setLoading(true);
        try {
            const userAddress = await signerInstance.getAddress();

            const [echoCountBigInt, whitelistManagerAddress] = await Promise.all([
                contract.echoCount(),
                contract.whitelistManager()
            ]);

            const echoCount = Number(echoCountBigInt);
            let whitelistManagerContract = null;
            if (whitelistManagerAddress && whitelistManagerAddress !== ethers.ZeroAddress) {
                whitelistManagerContract = new ethers.Contract(whitelistManagerAddress, ABIs.whitelistManager, signerInstance);
            }

            const oneDollarInWei = ethers.parseUnits("1", 18);
            let exchangeRate = 0n;
            try {
                exchangeRate = await contract.usdToEth(oneDollarInWei);
            } catch (e) {
                console.error("Error fetching exchange rate", e);
            }

            const calculateEthPrice = (usdPriceWei) => {
                if (!exchangeRate) return "0.0";

                const priceInEthWei = (BigInt(usdPriceWei) * exchangeRate) / oneDollarInWei;
                return parseFloat(ethers.formatEther(priceInEthWei)).toFixed(7);
            };

            const indices = Array.from({length: echoCount}, (_, i) => i);

            const promises = indices.map(async (i) => {
                try {

                    const itemCalls = [
                        contract.usdPricesById(i),
                        contract.maxMints(i),
                        contract.mintedSupply(i),
                        contract.whitelistOnlyById(i)
                    ];

                    if (whitelistManagerContract) {
                        itemCalls.push(whitelistManagerContract.isWhitelistedForEcho(i, userAddress));
                    }

                    const results = await Promise.all(itemCalls);

                    const onchainUsdPrice = results[0];
                    const metadata = echoMetadata[i] || {};

                    const ethPrice = calculateEthPrice(onchainUsdPrice);

                    return {
                        id: i,
                        priceUsdWei: onchainUsdPrice,
                        priceETH: ethPrice,
                        maxMints: Number(results[1]),
                        minted: Number(results[2]),
                        isWhitelistOnly: results[3],
                        userIsWhitelisted: whitelistManagerContract ? results[4] : false,

                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image,
                        attributes: metadata.attributes,
                    };
                } catch (err) {
                    console.error(`Failed to fetch echo #${i}`, err);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const loadedEchos = results.filter(item => item !== null);

            setEchos(loadedEchos);
            setSelectedEcho(prev => prev === null && loadedEchos.length > 0 ? loadedEchos[0] : prev);

        } catch (error) {
            console.error("Error fetching echo data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!isConnected || !walletProvider || isWrongNetwork) {
                if (mounted) setLoading(false);
                return;
            }

            try {
                if (mounted) setLoading(true);

                const ethersProvider = new ethers.BrowserProvider(walletProvider, activeNetwork.id);
                const walletSigner = await ethersProvider.getSigner();

                const contractInstance = new ethers.Contract(
                    import.meta.env.VITE_PILOT_NFT_ADDRESS,
                    ABIs.pilot,
                    walletSigner
                );

                if (mounted) {
                    setSigner(walletSigner);
                    setEchoContract(contractInstance);
                    await fetchAllEchoData(contractInstance, walletSigner);
                }
            } catch (error) {
                console.error('Init contract error:', error);
                if (mounted) setLoading(false);
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, [isConnected, walletProvider, isWrongNetwork, fetchAllEchoData]);

    const mintEcho = async () => {
        if (!isConnected) {
            open();
            return null;
        }
        if (isWrongNetwork) {
            switchNetwork(activeNetwork);
            return null;
        }
        if (!echoContract || !selectedEcho) return null;

        setMinting(true);
        try {
            let valueToSend = 0n;

            if (!selectedEcho.userIsWhitelisted) {
                valueToSend = await echoContract.usdToEth(selectedEcho.priceUsdWei);
            }

            const tx = await echoContract.mintEcho(selectedEcho.id, {value: valueToSend});
            await tx.wait();

            setEchos(prevEchos => prevEchos.map(echo => {
                if (echo.id === selectedEcho.id) {
                    return {...echo, minted: echo.minted + 1};
                }
                return echo;
            }));

            setSelectedEcho(prev => ({...prev, minted: prev.minted + 1}));

            return tx;

        } catch (error) {
            console.error('Mint error:', error);
            const msg = error.reason || error.shortMessage || error.message || "Unknown Error";
            alert('Error minting: ' + msg);
            return null;
        } finally {
            setMinting(false);
        }
    };

    const handleEchoSelect = (echo) => setSelectedEcho(echo);

    return {
        loading,
        minting,
        echos,
        selectedEcho,
        mintEcho,
        handleEchoSelect,
        isConnected,
        isWrongNetwork,
        currentNetworkName,
        targetNetworkName,
        openAppKit: open,
        switchNetwork: () => switchNetwork(activeNetwork)
    };
};