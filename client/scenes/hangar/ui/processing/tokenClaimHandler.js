import {ethers} from 'ethers';
import {CONFIG} from '../../../core/config.js';
import {checkSession} from '../../session.js';
import {getInventory} from '../../wallet/inventory.js';

export async function getMintingStatusFromContract(scene) {
    if (!scene.tokenMinterContract || !scene.walletAddress) {
        return null;
    }

    try {

        const [data, cumulativeWei, epochStepWei] = await Promise.all([
            scene.tokenMinterContract.getMintingStatus(scene.walletAddress),
            scene.tokenMinterContract.cumulativeMinted(),
            scene.tokenMinterContract.EPOCH_STEP()
        ]);

        let cumulativeVal = 0;
        let epochStepVal = 100000;

        try {
            cumulativeVal = parseFloat(ethers.formatEther(cumulativeWei));
            epochStepVal = parseFloat(ethers.formatEther(epochStepWei));
        } catch (e) {
            console.warn('Error parsing bigints:', e);
        }

        return {
            currentNonce: Number(data[0]),
            maxMintAmountWei: data[1],
            mintCooldown: Number(data[2]),
            lastMintTime: Number(data[3]),
            epoch: Number(data[4]),
            cumulativeMinted: cumulativeVal,
            epochStep: epochStepVal
        };

    } catch (error) {
        console.error('Failed to read minting status:', error);
        return null;
    }
}

export async function claimTokens(scene, coinsAmount, expectedEpoch) {
    console.log(`Starting mint. Coins: ${coinsAmount}, Epoch: ${expectedEpoch}`);

    try {
        const sessionResult = await checkSession(scene);
        if (!sessionResult.isValid) throw new Error(sessionResult.message);
        const token = scene.registry.get('session').token;

        scene.sysMessageContainer.addMessage('Requesting authorization...', 'DEFAULT');

        const requestBody = {
            walletAddress: scene.walletAddress,
            coinsAmount: coinsAmount.toString(),
            sessionToken: token,
            expectedEpoch: expectedEpoch
        };
        console.log('Sending payload to Web3Server:', requestBody);

        const response = await fetch(`${CONFIG.servers.web3}/get-token-claim-signature`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
            if (responseData.code === 'EPOCH_MISMATCH') {
                throw new Error(responseData.error);
            }
            if (responseData.error && responseData.error.includes('Insufficient')) {
                throw new Error('Not enough OSMS Coins in inventory.');
            }
            throw new Error(responseData.error || 'Failed to get claim signature.');
        }

        const {signature, deadline, claimId, amountWei} = responseData;

        scene.sysMessageContainer.addMessage('Please confirm the transaction in your wallet.', 'DEFAULT');

        const tx = await scene.tokenMinterContract.claimTokens(
            amountWei,
            claimId,
            deadline,
            signature
        );

        scene.sysMessageContainer.addMessage('Transaction sent. Minting tokens...', 'DEFAULT', 'infinite');

        await tx.wait();

        scene.sysMessageContainer.addMessage(`Successfully used ${coinsAmount} Coins!`, 'SUCCESS');
        console.log('Tokens claimed successfully! Tx:', tx.hash);

        await getInventory.call(scene);

        return true;

    } catch (error) {

        console.error('--- TOKEN CLAIM ERROR DETAILS ---');
        console.dir(error, {depth: null});
        console.error('---------------------------------');

        let friendlyErrorMessage = 'An unknown error occurred.';
        let messageType = 'ERROR';

        if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes('user rejected'))) {
            friendlyErrorMessage = 'Transaction cancelled.';
            messageType = 'WARNING';
        } else {

            const errorData = error.data || (error.info && error.info.error && error.info.error.data) || error.revert?.args;

            if (errorData) {

                const iface = new ethers.Interface([

                    "error InvalidDeadline()",
                    "error InvalidSignature()",
                    "error InvalidSigner()",
                    "error InvalidNonce()",
                    "error MintLimitExceeded(uint256 requested, uint256 limit)",
                    "error MintCooldownNotMet(uint256 nextMintTime)",
                    "error FeeTooHigh()",
                    "error ZeroAddress()",
                    "error InvalidNonce()",

                    "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
                    "error AccessControlBadConfirmation()",

                    "error EnforcedPause()",
                    "error ExpectedPause()",
                    "error OwnableUnauthorizedAccount(address account)",
                    "error OwnableInvalidOwner(address owner)"
                ]);

                try {
                    const decodedError = iface.parseError(errorData);

                    if (decodedError) {

                        switch (decodedError.name) {
                            case "InvalidSignature":
                                friendlyErrorMessage = "Contract Error: Invalid Signature (Server/Contract mismatch).";
                                break;
                            case "InvalidNonce":
                                friendlyErrorMessage = "Sync Error: Transaction counter mismatch. Please Reset MetaMask Activity.";
                                break;
                            case "AccessControlUnauthorizedAccount":
                                const missingRole = decodedError.args[1];
                                friendlyErrorMessage = `Contract Error: Missing Role ${missingRole}. Check Minter permissions in Token.`;
                                break;
                            case "MintLimitExceeded":
                                friendlyErrorMessage = `Mint Limit Exceeded.`;
                                break;
                            case "MintCooldownNotMet":
                                friendlyErrorMessage = "Cooldown active. Please wait.";
                                break;
                            default:
                                friendlyErrorMessage = `Contract Error: ${decodedError.name}`;

                                if (decodedError.args && decodedError.args.length > 0) {
                                    friendlyErrorMessage += ` (${decodedError.args.join(', ')})`;
                                }
                        }
                    } else {

                        friendlyErrorMessage = `Unknown Revert Data: ${errorData.toString().slice(0, 20)}...`;
                    }
                } catch (parseError) {

                    friendlyErrorMessage = error.reason || error.shortMessage || error.message || "Transaction Reverted";
                }
            } else {

                friendlyErrorMessage = error.reason || error.shortMessage || error.message || "Unknown Error";
            }
        }

        if (scene.sysMessageContainer) {
            scene.sysMessageContainer.addMessage(friendlyErrorMessage, messageType);
        }

        throw error;
    }
}