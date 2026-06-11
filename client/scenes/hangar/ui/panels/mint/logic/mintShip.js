import {ethers} from 'ethers';
import {updateUI} from '../../../../updateUI.js';
import {CONFIG} from '../../../../../core/config.js';
import {getShips} from '../../../../wallet/inventory';
import {checkSession} from '../../../../session.js';

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)"
];

const BLOCKS_TO_WAIT = 6;

export async function mintShip(shipData) {
    console.log(`Starting mint for shipTypeId: ${shipData.id}`);

    try {
        const sessionResult = await checkSession(this);
        if (!sessionResult.isValid) throw new Error(sessionResult.message);
        const token = this.registry.get('session').token;

        const tokenAddress = CONFIG.blockchain.OSMS_TOKEN_ADDRESS;
        const osmsToken = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const managerAddress = CONFIG.blockchain.SHIP_MANAGER_ADDRESS;

        const priceInWei = shipData.mintStatus.priceInWei;

        if (priceInWei > 0n) {
            this.sysMessageContainer.addMessage('Checking token allowance...', 'DEFAULT');
            const balance = await osmsToken.balanceOf(this.walletAddress);
            if (balance < priceInWei) {
                throw new Error(`Insufficient OSMS balance.`);
            }
            const currentAllowance = await osmsToken.allowance(this.walletAddress, managerAddress);
            if (currentAllowance < priceInWei) {
                this.sysMessageContainer.addMessage('Please approve OSMS spending...', 'DEFAULT');
                const txApprove = await osmsToken.approve(managerAddress, priceInWei);
                this.sysMessageContainer.addMessage('Approve pending...', 'DEFAULT', 'infinite');
                await txApprove.wait();
                this.sysMessageContainer.addMessage('Approve successful!', 'SUCCESS');
            }
        }

        const response = await fetch(`${CONFIG.servers.web3}/get-mint-signature`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                walletAddress: this.walletAddress,
                shipTypeId: shipData.id.toString(),
                sessionToken: token
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server error: ${errorData.error}`);
        }

        const {signature, deadline} = await response.json();

        this.sysMessageContainer.addMessage('Confirm mint transaction...', 'DEFAULT');

        const tx = await this.shipManagerContract.mintShip(
            shipData.id,
            deadline,
            signature
        );

        this.sysMessageContainer.addMessage('Transaction sent. Mining...', 'DEFAULT', 'infinite');

        const receipt = await tx.wait();
        const startBlock = receipt.blockNumber;
        console.log(`Ship minted at block ${startBlock}. Hash: ${tx.hash}`);

        await new Promise((resolve) => {

            const checkBlock = async (blockNumber) => {
                const confirmations = blockNumber - startBlock + 1;

                this.sysMessageContainer.addMessage(
                    `Syncing Database: ${confirmations}/${BLOCKS_TO_WAIT} blocks...`,
                    'DEFAULT',
                    'infinite'
                );

                console.log(`Waiting for DB sync: ${confirmations}/${BLOCKS_TO_WAIT} confirmations`);

                if (confirmations >= BLOCKS_TO_WAIT) {

                    this.provider.off("block", checkBlock);
                    resolve();
                }
            };

            this.provider.on("block", checkBlock);

            checkBlock(startBlock);
        });

        this.sysMessageContainer.addMessage('Finalizing...', 'SUCCESS');
        await getShips.call(this);

        if (this.ships.length > 0) {
            this.selectedShip = this.ships[this.ships.length - 1];
            console.log('Auto-selected new ship:', this.selectedShip);
        }

        this.sysMessageContainer.addMessage('Ship assembled and ready!', 'SUCCESS');

        if (this.mintShipsContainer) {
            this.mintShipsContainer.destroy();
            this.mintShipsContainer = null;
        }

        updateUI.call(this, this.scale.width, this.scale.height);

        if (this.scene && this.scene.sys) {
            this.scene.sys.queueDepthSort();
            this.scene.sys.renderer.snapshot(() => {
            });
        }
    } catch (error) {
        console.error('Minting ship error:', error);

        let friendlyErrorMessage = 'An unknown error occurred during minting.';
        let messageType = 'ERROR';

        if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes('user rejected'))) {
            friendlyErrorMessage = 'Transaction cancelled by user.';
            messageType = 'WARNING';
        } else if (error.data || (error.info && error.info.error && error.info.error.data)) {

            const errorData = error.data || error.info.error.data;

            const iface = new ethers.Interface([
                "error InvalidDeadline()",
                "error InvalidSignature()",
                "error ShipTypeDoesNotExist()",
                "error ShipTypeNotActive()",
                "error NoEchoOwned()",
                "error InsufficientETHSent()",
                "error ShipCanOnlyBeCrafted(uint256 shipTypeId)",
                "error SignatureAlreadyUsed()"
            ]);

            try {
                const decodedError = iface.parseError(errorData);

                if (decodedError) {
                    switch (decodedError.name) {
                        case "InvalidDeadline":
                            friendlyErrorMessage = "Time limit expired. Please try again.";
                            break;
                        case "InvalidSignature":
                            friendlyErrorMessage = "Security check failed (Invalid Signature). Please refresh and try again.";
                            break;
                        case "ShipTypeNotActive":
                            friendlyErrorMessage = "This ship type is currently disabled.";
                            break;
                        case "NoEchoOwned":
                            friendlyErrorMessage = "You need an Echo (Pilot NFT) to control a ship!";
                            break;
                        case "InsufficientETHSent":
                            friendlyErrorMessage = "Insufficient ETH sent for this transaction.";
                            break;
                        case "ShipCanOnlyBeCrafted":
                            friendlyErrorMessage = "This ship cannot be minted directly (Craft Only).";
                            break;
                        case "SignatureAlreadyUsed":
                            friendlyErrorMessage = "This transaction has already been processed.";
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

            if (error.message.includes('insufficient funds')) {
                friendlyErrorMessage = 'Insufficient funds in your wallet for gas + price.';
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