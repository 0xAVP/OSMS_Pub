const {ethers} = require('ethers');
const CONFIG = require('../core/config');
const shipNFTArtifact = require('./OSMSShipNFT.json');
const pilotNFTArtifact = require('./OSMSEchoNFT.json');
const shipManagerArtifact = require('./OSMSShipManager.json');
const tokenMinterArtifact = require('./OSMSTokenMinter.json');
const EventEmitter = require('events');
const logger = require('../core/logger');
const {getSecret, decryptSecret} = require("../core/secrets");

let provider;
let shipNFTContract;
let pilotNFTContract;
let shipManagerContract;
let tokenMinterContract;

let isConnected = false;
let isInitializing = false;
const connectionEmitter = new EventEmitter();

async function getSignerAndContracts() {
    if (!provider || !provider.websocket || provider.websocket.readyState !== provider.websocket.OPEN) {
        throw new Error('Blockchain provider is not connected.');
    }

    let privateKey = null;
    try {
        const encryptedPkey = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_SIGNER_PKEY);
        if (!encryptedPkey) {
            throw new Error('Зашифрованный ключ подписи (ENCRYPTED_SIGNER_PKEY) не найден.');
        }

        privateKey = await decryptSecret(encryptedPkey);
        const signerWallet = new ethers.Wallet(privateKey, provider);

        const tempShipNFTContract = new ethers.Contract(CONFIG.blockchain.env.SHIP_NFT_ADDRESS, shipNFTArtifact.abi, signerWallet);
        const tempPilotNFTContract = new ethers.Contract(CONFIG.blockchain.env.ECHO_NFT_ADDRESS, pilotNFTArtifact.abi, signerWallet);
        const tempShipManagerContract = new ethers.Contract(CONFIG.blockchain.env.SHIP_MANAGER_ADDRESS, shipManagerArtifact.abi, signerWallet);
        const tempTokenMinterContract = new ethers.Contract(CONFIG.blockchain.env.TOKEN_MINTER_ADDRESS, tokenMinterArtifact.abi, signerWallet);

        return {
            signerWallet,
            shipNFTContract: tempShipNFTContract,
            pilotNFTContract: tempPilotNFTContract,
            shipManagerContract: tempShipManagerContract,
            tokenMinterContract: tempTokenMinterContract,
            provider
        };

    } catch (error) {
        logger.error('[Security] Failed to create signer on-the-fly.', {message: error.message});
        throw error;
    } finally {

        privateKey = null;
    }
}

async function initializeProviderAndContracts() {
    if (isInitializing) return;
    isInitializing = true;
    logger.debug('Web3Server: Initializing wallet and contracts...');

    try {
        provider = new ethers.WebSocketProvider(CONFIG.blockchain.env.INFURA_RPC_URL);

        provider.websocket.on('open', () => {
            logger.info('Web3Server: WebSocket connection to RPC provider is open.');
            isConnected = true;
            connectionEmitter.emit('reconnected');

            const pingInterval = setInterval(() => {
                if (provider.websocket.readyState === provider.websocket.OPEN) {
                    console.log('Web3Server: Sending ping to Infura.');
                    provider.websocket.ping();
                }
            }, CONFIG.blockchain.PING_INTERVAL_MS);

            provider.websocket.on('close', () => {
                logger.debug('Web3Server: Clearing ping interval.');
                clearInterval(pingInterval);
            });
        });

        provider.websocket.on('pong', () => {
            logger.debug('Web3Server: Received pong from Infura.');
        });

        provider.websocket.on('close', (code, reason) => {
            logger.warn(`Web3Server: WebSocket connection closed with code ${code}, reason: ${reason || 'unknown'}`);
            isConnected = false;
            if (provider.websocket) provider.websocket.terminate();
            setTimeout(initializeProviderAndContracts, CONFIG.blockchain.RECONNECT_TIMEOUT_MS);
        });

        provider.websocket.on('error', (err) => {
            logger.error('Web3Server: WebSocket RPC provider error:', err.message);
        });

        await provider.ready;
        logger.info('Web3Server: Blockchain provider successfully initialized.');

        shipNFTContract = new ethers.Contract(CONFIG.blockchain.env.SHIP_NFT_ADDRESS, shipNFTArtifact.abi, provider);
        pilotNFTContract = new ethers.Contract(CONFIG.blockchain.env.ECHO_NFT_ADDRESS, pilotNFTArtifact.abi, provider);
        shipManagerContract = new ethers.Contract(CONFIG.blockchain.env.SHIP_MANAGER_ADDRESS, shipManagerArtifact.abi, provider);
        tokenMinterContract = new ethers.Contract(CONFIG.blockchain.env.TOKEN_MINTER_ADDRESS, tokenMinterArtifact.abi, provider);

        logger.info('Web3Server: Read-only contracts successfully initialized.');

    } catch (err) {
        logger.error('Web3Server: Failed to initialize provider:', err.message);
        setTimeout(initializeProviderAndContracts, CONFIG.blockchain.RECONNECT_TIMEOUT_MS);
    } finally {
        isInitializing = false;
    }
}

module.exports = {
    getSignerAndContracts,
    initializeContracts: initializeProviderAndContracts,
    getContracts: () => ({shipNFTContract, pilotNFTContract, shipManagerContract, tokenMinterContract, provider}),
    isProviderConnected: () => isConnected,
    connectionEmitter
};