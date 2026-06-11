import {ethers} from 'ethers';

export async function getShipMintStatus(scene, shipType) {

    const {id, mintPrice, craftPrice, craftableOnly} = shipType;
    const walletAddress = scene.walletAddress;

    if (craftableOnly) {
        const hasCraftPrice = craftPrice > 0n;
        return {
            status: 'CRAFT_ONLY',
            displayPrice: hasCraftPrice ? `${ethers.formatEther(craftPrice)} ETH` : 'Free (ETH)',
            priceInWei: craftPrice,
            message: 'Requires a specific Hull to craft.',
            canAction: true
        };
    }

    if (id === 0) {
        try {

            const hasMinted = await scene.shipNFTContract.hasMintedFreeNebular(walletAddress);

            const isPilotMinter = await scene.pilotContract.isEchoMinter(walletAddress);

            if (!hasMinted && isPilotMinter) {
                return {
                    status: 'FREE',
                    displayPrice: 'Free (First Echo)',
                    priceInWei: 0n,
                    canAction: true
                };
            }
        } catch (e) {
            console.error("Could not check free Nebular status:", e);
        }
    }

    return {
        status: 'MINTABLE',
        displayPrice: `${ethers.formatEther(mintPrice)} OSMS`,
        priceInWei: mintPrice,
        canAction: true
    };
}