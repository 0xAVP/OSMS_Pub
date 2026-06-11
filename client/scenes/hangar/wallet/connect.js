import {ethers} from 'ethers';
import {ABIs} from '../../../abi';
import {CONFIG} from "../../core/config";

/**
 * Инициализирует Web3 окружение сцены, используя провайдер из AppKit (через Registry).
 * @this {Phaser.Scene}
 */
export async function initializeWeb3() {
    console.log('Initializing Web3 with AppKit provider...');

    const appKitProvider = this.registry.get('walletProvider');
    const registryAddress = this.registry.get('walletAddress');

    if (!appKitProvider || !registryAddress) {
        throw new Error('Wallet provider not found in Game Registry.');
    }

    if (this.signer && this.walletAddress === registryAddress) {
        console.log('Web3 already initialized.');
        return;
    }

    try {

        const provider = new ethers.BrowserProvider(appKitProvider, 'any');

        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        this.provider = provider;
        this.signer = signer;
        this.walletAddress = address;

        this.pilotContract = new ethers.Contract(CONFIG.blockchain.PILOT_NFT_ADDRESS, ABIs.pilot, signer);
        this.shipNFTContract = new ethers.Contract(CONFIG.blockchain.SHIP_NFT_ADDRESS, ABIs.ship, signer);
        this.shipManagerContract = new ethers.Contract(CONFIG.blockchain.SHIP_MANAGER_ADDRESS, ABIs.shipManager, signer);
        this.tokenMinterContract = new ethers.Contract(CONFIG.blockchain.TOKEN_MINTER_ADDRESS, ABIs.tokenMinter, signer);

        this.walletConnected = true;
        console.log('Web3 initialized successfully for:', this.walletAddress);

    } catch (error) {
        console.error('Error initializing Web3:', error);
        this.walletConnected = false;
        throw error;
    }
}