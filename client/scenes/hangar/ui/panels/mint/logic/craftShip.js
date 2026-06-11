import {ethers} from 'ethers';
import {CONFIG} from '../../../../../core/config.js';
import {checkSession} from '../../../../session.js';
import {getShips} from "../../../../wallet/inventory";
import {SHIP_LORE_DATA} from "../components/shipsData";
import {updateInventoryLocally} from "../../../actionUtils";

export async function craftShip(shipData) {
    console.log(`Starting craft process for shipTypeId: ${shipData.id}`);

    const loreData = SHIP_LORE_DATA[shipData.name];
    if (loreData && loreData.craftingRequirements) {

        const resourcesToDeduct = Object.entries(loreData.craftingRequirements).map(([itemId, reqData]) => ({
            itemId: itemId,
            category: reqData.category,
            quantityToDecrement: reqData.quantity
        }));

        if (resourcesToDeduct.length > 0) {
            updateInventoryLocally(this, resourcesToDeduct);
        }
    }

    try {

        const sessionResult = await checkSession(this);
        if (!sessionResult.isValid) {
            throw new Error(sessionResult.message || 'Session is invalid');
        }
        const token = this.registry.get('session').token;

        this.sysMessageContainer.addMessage('Requesting craft authorization...', 'DEFAULT');

        const response = await fetch(`${CONFIG.servers.web3}/get-craft-signature`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                walletAddress: this.walletAddress,
                shipTypeId: shipData.id,
                sessionToken: token
            })
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
            throw new Error(responseData.error || 'Failed to get craft signature from server.');
        }

        const {signature, deadline, craftId} = responseData;

        const craftPriceInWei = shipData.craftPrice || 0n;
        console.log(`Craft price from cached ship data: ${ethers.formatEther(craftPriceInWei)} ETH`);

        this.sysMessageContainer.addMessage('Please confirm the transaction in your wallet.', 'DEFAULT');

        const tx = await this.shipManagerContract.craftShip(
            shipData.id,
            craftId,
            deadline,
            signature,
            {value: craftPriceInWei}
        );

        this.sysMessageContainer.addMessage('Transaction sent. Awaiting confirmation...', 'DEFAULT', 'infinite');
        await tx.wait();

        this.sysMessageContainer.addMessage('Craft successful! Assembling the ship...', 'SUCCESS', 'infinite');

        console.log('Ship crafted successfully! Transaction hash:', tx.hash);

        await new Promise(resolve => setTimeout(resolve, 1500));
        await getShips.call(this);

    } catch (error) {
        console.error('Crafting ship error:', error);

        let friendlyErrorMessage = 'An unknown error occurred during crafting.';
        let messageType = 'ERROR';

        if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes('user rejected'))) {
            friendlyErrorMessage = 'Crafting transaction cancelled.';
            messageType = 'WARNING';
        } else if (error.data || (error.info && error.info.error && error.info.error.data)) {
            const errorData = error.data || error.info.error.data;

            const iface = new ethers.Interface([
                "error InvalidDeadline()",
                "error InvalidSignature()",
                "error InvalidCraftingSignature()",
                "error SignatureAlreadyUsed()",
                "error ShipTypeNotActive()",
                "error NoEchoOwned()",
                "error InsufficientETHSent()",
                "error ShipCanOnlyBeMinted(uint256 shipTypeId)"
            ]);

            try {
                const decodedError = iface.parseError(errorData);

                if (decodedError) {
                    switch (decodedError.name) {
                        case "InvalidDeadline":
                            friendlyErrorMessage = "Crafting window expired. Please try again.";
                            break;
                        case "SignatureAlreadyUsed":
                            friendlyErrorMessage = "This craft request has already been processed.";
                            break;
                        case "InvalidCraftingSignature":
                        case "InvalidSignature":
                            friendlyErrorMessage = "Security check failed. Please refresh the page.";
                            break;
                        case "NoEchoOwned":
                            friendlyErrorMessage = "You need an Echo (Pilot NFT) to receive a ship!";
                            break;
                        case "ShipTypeNotActive":
                            friendlyErrorMessage = "Crafting for this ship is currently disabled.";
                            break;
                        case "InsufficientETHSent":
                            friendlyErrorMessage = "Insufficient ETH to cover the craft fee.";
                            break;
                        case "ShipCanOnlyBeMinted":
                            friendlyErrorMessage = "This ship cannot be crafted (Mint Only).";
                            break;
                        default:
                            friendlyErrorMessage = `Contract Error: ${decodedError.name}`;
                    }
                }
            } catch (parseError) {
                console.warn('Failed to parse contract error:', parseError);
                friendlyErrorMessage = 'Transaction reverted (Unknown Reason).';
            }
        } else if (error.message) {

            if (error.message.includes('Resource reservation failed') || error.message.includes('Not enough materials')) {
                friendlyErrorMessage = "Not enough resources in inventory to craft.";
            } else if (error.message.includes('insufficient funds')) {
                friendlyErrorMessage = 'Insufficient funds for gas.';
            } else {
                friendlyErrorMessage = error.message;
            }
        }

        if (this.sysMessageContainer) {
            this.sysMessageContainer.addMessage(friendlyErrorMessage, messageType);
        }

        throw error;
    }
}