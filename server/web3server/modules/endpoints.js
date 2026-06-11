const {ethers} = require('ethers');
const cors = require('cors');
const {Router} = require('express');
const CONFIG = require('../core/config');
const {publicApiLimiter} = require('../middleware/rateLimiter');
const {verifyInternalRequest} = require('../middleware/verifyInternalRequest');
const {PILOT_BONUSES} = require('../entities/pilotBonuses');
const {createSession, verifySession} = require('./session');
const {isValidWalletAddress, isValidNumber, isValidString} = require('./validation');
const {getContracts, getSignerAndContracts} = require('../contracts/contracts');
const logger = require('../core/logger');
const {waitForDbResponse, safeSend, generateRequestId} = require("../core/utils");
const crypto = require('crypto');

const authChallenges = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [wallet, data] of authChallenges.entries()) {
        if (now > data.expiry) authChallenges.delete(wallet);
    }
}, 60000);

module.exports = function endpoints(app, getDbStatus) {

    const publicRouter = Router();

    const corsOptions = {
        origin: CONFIG.server.CORS_ORIGIN ? CONFIG.server.CORS_ORIGIN.split(',') : [],
        methods: ['POST'],
        allowedHeaders: ['Content-Type']
    };

    publicRouter.use(cors(corsOptions));

    publicRouter.use(publicApiLimiter);

    publicRouter.post('/verify-wallet', async (req, res) => {
        let {walletAddress, signature, sessionToken} = req.body;

        if (!isValidWalletAddress(walletAddress)) {
            console.log('Invalid wallet address');
            return res.status(400).json({error: 'Invalid wallet'});
        }
        walletAddress = walletAddress.toLowerCase();

        if (!signature) {
            const nonce = crypto.randomBytes(16).toString('hex');
            const challenge = `OneSoulManyShips Auth: ${nonce}`;

            authChallenges.set(walletAddress, {
                challenge,
                expiry: Date.now() + 120000
            });

            return res.json({success: true, challenge});
        }

        if (!isValidString(signature, 132)) {
            return res.status(400).json({error: 'Invalid signature format'});
        }

        const stored = authChallenges.get(walletAddress);

        if (!stored || Date.now() > stored.expiry) {
            return res.status(400).json({error: 'Auth challenge expired. Please request a new one.'});
        }

        try {

            const recoveredAddress = ethers.verifyMessage(stored.challenge, signature);

            if (recoveredAddress.toLowerCase() !== walletAddress) {
                return res.status(400).json({error: 'Invalid signature'});
            }

            authChallenges.delete(walletAddress);

            const {dbConnected, dbWs, identified, pendingRequests} = getDbStatus();
            if (!dbConnected || dbWs.readyState !== WebSocket.OPEN || !identified) {
                logger.error('Web3Server: Database server unavailable or not identified', {
                    dbConnected,
                    readyState: dbWs.readyState,
                    identified
                });
                return res.status(503).json({error: 'Database server unavailable or not identified'});
            }

            let sessionData;
            if (sessionToken) {
                sessionData = await verifySession(dbWs, walletAddress, sessionToken, pendingRequests);
            }

            if (!sessionData) {
                sessionData = await createSession(dbWs, walletAddress, pendingRequests);
            }

            res.json({
                success: true,
                sessionToken: sessionData.sessionToken,
                expiry: sessionData.expiry,
                createdAt: sessionData.createdAt
            });
        } catch (error) {
            logger.error('Web3Server: Error verifying signature:', error.message);
            res.status(400).json({error: 'Invalid signature format'});
        }
    });

    publicRouter.post('/get-mint-signature', async (req, res) => {
        logger.debug('Web3Server: Incoming request to /get-mint-signature');

        let {walletAddress, shipTypeId, sessionToken} = req.body;

        if (!isValidWalletAddress(walletAddress)) {
            return res.status(400).json({error: 'Invalid walletAddress format'});
        }
        walletAddress = walletAddress.toLowerCase();

        if (!isValidNumber(shipTypeId, 0, Number.MAX_SAFE_INTEGER)) {
            return res.status(400).json({error: 'Invalid shipTypeId'});
        }
        if (!isValidString(sessionToken, 64)) {
            return res.status(400).json({error: 'Invalid sessionToken format'});
        }

        const {dbConnected, dbWs, identified, pendingRequests} = getDbStatus();
        if (!dbConnected || !identified) {
            return res.status(503).json({error: 'Service unavailable'});
        }

        const sessionData = await verifySession(dbWs, walletAddress, sessionToken, pendingRequests);
        if (!sessionData) {
            return res.status(401).json({error: 'Invalid session token'});
        }

        try {

            const {signerWallet, shipManagerContract, provider} = await getSignerAndContracts();

            if (!signerWallet || !shipManagerContract) {
                return res.status(503).json({error: 'Web3 provider is not available'});
            }

            const nonce = await shipManagerContract.getNonce(walletAddress);

            const nowSeconds = await getBlockchainTime(provider);

            const deadline = nowSeconds + 240;

            const messageHash = ethers.solidityPackedKeccak256(
                ['address', 'uint256', 'uint256', 'uint256'],
                [walletAddress, shipTypeId, nonce, deadline]
            );

            const signature = await signerWallet.signMessage(ethers.getBytes(messageHash));

            logger.info(`Web3Server: Signed mint for ${walletAddress} (Nonce: ${nonce})`);

            res.json({signature, deadline});

        } catch (error) {
            logger.error('Web3Server: Error generating mint signature:', error.message);
            res.status(500).json({error: 'Failed to generate signature'});
        }
    });

    publicRouter.post('/get-craft-signature', async (req, res) => {
        logger.debug('Web3Server: Incoming request to /get-craft-signature');

        let {walletAddress, shipTypeId, sessionToken} = req.body;

        if (!isValidWalletAddress(walletAddress)) {
            return res.status(400).json({error: 'Invalid walletAddress format'});
        }
        walletAddress = walletAddress.toLowerCase();

        if (!isValidNumber(shipTypeId, 0, Number.MAX_SAFE_INTEGER)) {
            return res.status(400).json({error: 'Invalid shipTypeId'});
        }
        if (!isValidString(sessionToken, 64)) {
            return res.status(400).json({error: 'Invalid sessionToken format'});
        }

        const {dbConnected, dbWs, identified, pendingRequests} = getDbStatus();
        if (!dbConnected || !identified) {
            return res.status(503).json({error: 'Core service unavailable'});
        }

        const sessionData = await verifySession(dbWs, walletAddress, sessionToken, pendingRequests);
        if (!sessionData) {
            return res.status(401).json({error: 'Invalid or expired session token'});
        }

        try {

            const requestId = generateRequestId();

            safeSend(dbWs, 'reserve-resources-for-ship-craft', requestId, {walletAddress, shipTypeId});

            const dbResponse = await waitForDbResponse(dbWs, 'reserve-resources-for-ship-craft-response', requestId, pendingRequests);

            if (!dbResponse.payload.success) {

                logger.warn(`Web3Server: dbServer denied craft for ${walletAddress}: ${dbResponse.payload.error}`);
                return res.status(409).json({error: dbResponse.payload.error || 'Resource reservation failed'});
            }

            const {craftId} = dbResponse.payload;

            const {signerWallet, provider} = await getSignerAndContracts();

            const latestTimestamp = await getBlockchainTime(provider);
            const deadline = latestTimestamp + 240;

            const messageHash = ethers.solidityPackedKeccak256(
                ['string', 'address', 'uint256', 'bytes32', 'uint256'],
                ["CRAFT_SHIP", walletAddress, shipTypeId, craftId, deadline]
            );

            const signature = await signerWallet.signMessage(ethers.getBytes(messageHash));

            logger.info(`Web3Server: Signed craft for ${walletAddress}, craftId: ${craftId}`);

            res.json({
                success: true,
                signature,
                deadline,
                craftId: craftId
            });

        } catch (error) {
            logger.error(`Web3Server: Error /get-craft-signature: ${error.message}`);
            res.status(500).json({error: 'Failed to generate craft signature'});
        }
    });

    publicRouter.post('/get-token-claim-signature', async (req, res) => {

        logger.debug('Web3Server: Incoming request to /get-token-claim-signature');

        let {walletAddress, coinsAmount, sessionToken, expectedEpoch} = req.body;

        if (!isValidWalletAddress(walletAddress)) {
            return res.status(400).json({error: 'Invalid walletAddress format'});
        }
        walletAddress = walletAddress.toLowerCase();

        if (!coinsAmount || isNaN(Number(coinsAmount)) || Number(coinsAmount) <= 0) {
            return res.status(400).json({error: 'Invalid coins amount.'});
        }

        if (!isValidString(sessionToken, 64)) {
            return res.status(400).json({error: 'Invalid sessionToken format'});
        }

        const {dbConnected, dbWs, identified, pendingRequests} = getDbStatus();
        if (!dbConnected || dbWs.readyState !== WebSocket.OPEN || !identified) {
            return res.status(503).json({error: 'Core service unavailable'});
        }

        const sessionData = await verifySession(dbWs, walletAddress, sessionToken, pendingRequests);
        if (!sessionData) {
            return res.status(401).json({error: 'Invalid or expired session token'});
        }

        try {
            const {signerWallet, tokenMinterContract, provider} = await getSignerAndContracts();
            const contractAddress = tokenMinterContract.target;

            const mintData = await tokenMinterContract.getMintingStatus(walletAddress);
            const currentNonce = mintData[0];
            const maxAmountLimit = mintData[1];
            const cooldownSeconds = Number(mintData[2]);
            const lastMintTimestamp = Number(mintData[3]);
            const currentEpoch = Number(mintData[4]);

            if (currentEpoch !== Number(expectedEpoch)) {
                return res.status(409).json({
                    error: `Epoch changed from ${expectedEpoch} to ${currentEpoch}. Please refresh the page.`,
                    code: 'EPOCH_MISMATCH'
                });
            }

            const coinsInt = BigInt(coinsAmount);
            const epochInt = BigInt(currentEpoch);

            const weiMultiplier = BigInt(10) ** BigInt(18);
            const tokensWeiBigInt = (coinsInt * weiMultiplier) / epochInt;

            const tokensWeiString = tokensWeiBigInt.toString();

            if (tokensWeiBigInt > maxAmountLimit) {
                return res.status(400).json({error: `Output tokens exceed mint limit`});
            }

            const nowSeconds = await getBlockchainTime(provider);

            const nextAllowedTime = lastMintTimestamp + cooldownSeconds;

            if (nowSeconds < nextAllowedTime) {
                const waitSeconds = nextAllowedTime - nowSeconds;
                const waitHours = (waitSeconds / 3600).toFixed(1);
                return res.status(429).json({error: `Mint cooldown active. Try again in ${waitHours} hours.`});
            }

            const requestId = generateRequestId();

            safeSend(dbWs, 'reserve-resources-for-token-claim', requestId, {
                walletAddress,
                coinsAmount: coinsAmount.toString(),
                epoch: currentEpoch
            });

            const dbResponse = await waitForDbResponse(dbWs, 'reserve-resources-for-token-claim-response', requestId, pendingRequests);

            if (!dbResponse.payload.success) {
                return res.status(409).json({error: dbResponse.payload.error});
            }

            const {claimId} = dbResponse.payload;

            const deadline = nowSeconds + 240;

            const messageHash = ethers.solidityPackedKeccak256(
                ['address', 'address', 'uint256', 'bytes32', 'uint256', 'uint256'],
                [
                    contractAddress,
                    walletAddress,
                    tokensWeiString,
                    claimId,
                    currentNonce,
                    deadline
                ]
            );

            const signature = await signerWallet.signMessage(ethers.getBytes(messageHash));

            logger.info(`Web3Server: Signed token claim for ${walletAddress}: ${coinsAmount} Coins, deadline: ${deadline}`);

            res.json({
                success: true,
                signature,
                deadline,
                claimId,
                amountWei: tokensWeiString
            });

        } catch (error) {
            logger.error(`Web3Server: Error during /get-token-claim-signature: ${error.message}`, {stack: error.stack});
            res.status(500).json({error: 'Failed to generate token signature'});
        }
    });

    const internalRouter = Router();

    internalRouter.use(verifyInternalRequest);

    internalRouter.get('/verify-pilot/:pilotId/:walletAddress', async (req, res) => {
        let {pilotId, walletAddress} = req.params;

        if (!isValidNumber(pilotId, 0, 1000)) {
            return res.status(400).json({error: 'Invalid pilotId format'});
        }
        if (!isValidWalletAddress(walletAddress)) {
            return res.status(400).json({error: 'Invalid walletAddress format'});
        }

        walletAddress = walletAddress.toLowerCase();

        const {pilotNFTContract} = getContracts();
        if (!pilotNFTContract) {
            return res.status(503).json({error: 'Web3 provider is not available'});
        }

        try {
            const balance = await pilotNFTContract.balanceOf(walletAddress, pilotId);
            if (balance === 0n || !balance) {
                return res.status(404).json({
                    success: false,
                    reason: 'Pilot token does not exist or not owned by this wallet'
                });
            }

            if (!PILOT_BONUSES.hasOwnProperty(pilotId)) {
                return res.status(400).json({success: false, reason: 'Unknown pilot ID'});
            }

            const bonuses = PILOT_BONUSES[pilotId];
            res.json({success: true, bonuses});
        } catch (error) {
            logger.error(`Web3Server: Error verifying pilot ${pilotId} for ${walletAddress}:`, error.message);
            res.status(500).json({success: false, reason: 'Server error'});
        }
    });
    internalRouter.get('/verify-ship/:shipId/:walletAddress', async (req, res) => {
        let {shipId, walletAddress} = req.params;

        if (!isValidNumber(shipId, 0, Number.MAX_SAFE_INTEGER)) {
            return res.status(400).json({error: 'Invalid shipId format'});
        }
        if (!isValidWalletAddress(walletAddress)) {
            return res.status(400).json({error: 'Invalid walletAddress format'});
        }

        walletAddress = walletAddress.toLowerCase();

        const {shipNFTContract} = getContracts();
        if (!shipNFTContract) {
            return res.status(503).json({error: 'Web3 provider is not available'});
        }

        try {

            const owner = await shipNFTContract.ownerOf(shipId);
            if (!owner || owner.toLowerCase() !== walletAddress.toLowerCase()) {
                logger.warn(`Web3Server: Ship ${shipId} is not owned by ${walletAddress}`);
                return res.status(404).json({
                    success: false,
                    reason: 'Ship token does not exist or not owned by this wallet'
                });
            }

            res.json({success: true});
        } catch (error) {
            logger.error(`Web3Server: Error verifying ship ${shipId} for ${walletAddress}:`, error.message);

            if (error.message.includes('execution reverted') || error.message.includes('ERC721NonexistentToken')) {
                return res.status(404).json({
                    success: false,
                    reason: 'Ship token does not exist or not owned by this wallet'
                });
            }
            res.status(500).json({success: false, reason: 'Server error'});
        }
    });
    internalRouter.get('/get-craft-status/:craftId', async (req, res) => {
        const {craftId} = req.params;

        if (typeof craftId !== 'string' || !/^0x[a-f0-9]{64}$/i.test(craftId)) {
            return res.status(400).json({success: false, error: 'Invalid craftId format'});
        }

        const {shipManagerContract} = getContracts();

        if (!shipManagerContract) {
            return res.status(503).json({success: false, error: 'Web3 provider is not available'});
        }

        try {
            const eventFilter = shipManagerContract.filters.ShipCrafted(null, null, null, craftId);

            const currentBlock = await shipManagerContract.runner.provider.getBlockNumber();

            const searchRange = 5000;
            const fromBlock = Math.max(0, currentBlock - searchRange);

            const logs = await shipManagerContract.queryFilter(eventFilter, fromBlock, 'latest');

            if (logs.length > 0) {
                const eventData = logs[0];
                res.json({
                    success: true,
                    status: 'FINALIZED',
                    transactionHash: eventData.transactionHash,
                    tokenId: eventData.args.tokenId.toString(),
                });
            } else {
                res.json({
                    success: true,
                    status: 'NOT_FOUND',
                });
            }
        } catch (error) {
            logger.error(`[Сверщик] Ошибка при проверке статуса craftId ${craftId}:`, error.message);
            res.status(500).json({success: false, error: 'Server error during craft status check'});
        }
    });
    internalRouter.get('/get-claim-status/:claimId', async (req, res) => {
        const {claimId} = req.params;

        if (typeof claimId !== 'string' || !/^0x[a-f0-9]{64}$/i.test(claimId)) {
            return res.status(400).json({success: false, error: 'Invalid claimId format'});
        }

        const {tokenMinterContract} = getContracts();

        if (!tokenMinterContract) {
            return res.status(503).json({success: false, error: 'Web3 provider is not available'});
        }

        try {

            const eventFilter = tokenMinterContract.filters.TokensClaimed(null, null, null, null, claimId);

            const currentBlock = await tokenMinterContract.runner.provider.getBlockNumber();
            const searchRange = 5000;
            const fromBlock = Math.max(0, currentBlock - searchRange);

            const logs = await tokenMinterContract.queryFilter(eventFilter, fromBlock, 'latest');

            if (logs.length > 0) {
                const eventData = logs[0];
                res.json({
                    success: true,
                    status: 'FINALIZED',
                    transactionHash: eventData.transactionHash,

                });
            } else {
                res.json({
                    success: true,
                    status: 'NOT_FOUND',
                });
            }
        } catch (error) {
            logger.error(`[Сверщик] Ошибка при проверке статуса claimId ${claimId}:`, error.message);
            res.status(500).json({success: false, error: 'Server error during claim status check'});
        }
    });

    app.use('/', publicRouter);
    app.use('/internal/api/v1', internalRouter);

};

let timeOffset = 0;
let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 1000 * 60 * 60;

async function getBlockchainTime(provider) {
    const nowMs = Date.now();

    if (lastSyncTime === 0 || (nowMs - lastSyncTime > SYNC_INTERVAL_MS)) {
        try {
            const block = await provider.getBlock('latest');
            const networkTimeSec = block.timestamp;
            const serverTimeSec = Math.floor(nowMs / 1000);

            timeOffset = networkTimeSec - serverTimeSec;
            lastSyncTime = nowMs;

            logger.info(`Web3Server: Time synced. Server: ${serverTimeSec}, Chain: ${networkTimeSec}, Offset: ${timeOffset}s`);
        } catch (error) {
            logger.error('Web3Server: Failed to sync time with blockchain, using local time:', error.message);

        }
    }

    return Math.floor(Date.now() / 1000) + timeOffset;
}