const {getContracts, connectionEmitter} = require('../contracts/contracts');
const logger = require('../core/logger');
const {safeSend, generateRequestId} = require('../core/utils');

const CONFIRMATIONS_REQUIRED = 5;
const MAX_RETRIES = 3;
const RETRY_SEND_DELAY_MS = 2000;

class BlockchainListener {
    constructor(dbWsProvider) {
        this.dbWsProvider = dbWsProvider;
        this.isListening = false;

        this.shipManagerContract = null;
        this.tokenMinterContract = null;
        this.provider = null;

        this.handleShipEvent = this._processShipCrafted.bind(this);
        this.handleTokenEvent = this._processTokensClaimed.bind(this);
        this.handleReconnect = this._onProviderReconnect.bind(this);
    }

    /**
     * Запуск сервиса
     */
    async start() {
        if (this.isListening) {
            logger.warn('[Listener] Сервис уже работает.', 'blockchain');
            return;
        }

        connectionEmitter.on('reconnected', this.handleReconnect);

        const contracts = getContracts();

        if (!contracts.shipManagerContract || !contracts.tokenMinterContract || !contracts.provider) {
            logger.info('[Listener] Контракты не готовы. Ждем подключения...', 'blockchain');
            return;
        }

        this.shipManagerContract = contracts.shipManagerContract;
        this.tokenMinterContract = contracts.tokenMinterContract;
        this.provider = contracts.provider;

        this.isListening = true;

        this._setupRealtimeListeners();
    }

    /**
     * Остановка сервиса
     */
    stop() {
        if (!this.isListening) return;

        logger.info('[Listener] Остановка сервиса...', 'blockchain');

        if (this.shipManagerContract) {
            this.shipManagerContract.removeAllListeners("ShipCrafted");
        }
        if (this.tokenMinterContract) {
            this.tokenMinterContract.removeAllListeners("TokensClaimed");
        }

        connectionEmitter.off('reconnected', this.handleReconnect);

        this.isListening = false;
        this.shipManagerContract = null;
        this.tokenMinterContract = null;
    }

    /**
     * Реакция на переподключение провайдера
     */
    _onProviderReconnect() {
        logger.info('[Listener] Сигнал реконнекта. Перезапуск...', 'blockchain');
        this.stop();
        setTimeout(() => this.start(), 1000);
    }

    _setupRealtimeListeners() {
        logger.info('[Listener] Включение Real-time (WebSocket)...', 'blockchain');

        this.shipManagerContract.on("ShipCrafted", this.handleShipEvent);
        this.tokenMinterContract.on("TokensClaimed", this.handleTokenEvent);
    }

    async _processShipCrafted(crafter, tokenId, shipTypeId, craftId, event) {

        const txHash = event.transactionHash || event.log?.transactionHash;

        logger.info(`[Listener] DETECTED: ShipCrafted. CraftId: ${craftId}. Waiting confirmations...`, 'blockchain');

        try {
            if (event.getTransaction) {
                const tx = await event.getTransaction();
                if (tx) await tx.wait(CONFIRMATIONS_REQUIRED);
            } else if (event.wait) {
                try {
                    await event.wait(CONFIRMATIONS_REQUIRED);
                } catch (e) { /* ignore */
                }
            }

            logger.info(`[Listener] CONFIRMED: ShipCrafted ${craftId}. Sending to DB...`, 'blockchain');

            await this._sendFinalizationRequest('finalize-craft-reservation', 'craftId', craftId, txHash);

        } catch (error) {
            logger.error(`[Listener] Error processing ShipCrafted (Tx: ${txHash}): ${error.message}`, 'blockchain');
        }
    }

    async _processTokensClaimed(user, totalMinted, userReceived, feeTaken, claimId, event) {
        const txHash = event.transactionHash || event.log?.transactionHash;

        logger.info(`[Listener] DETECTED: TokensClaimed. ClaimId: ${claimId}. Waiting confirmations...`, 'blockchain');

        try {
            if (event.getTransaction) {
                const tx = await event.getTransaction();
                if (tx) await tx.wait(CONFIRMATIONS_REQUIRED);
            } else if (event.wait) {
                try {
                    await event.wait(CONFIRMATIONS_REQUIRED);
                } catch (e) { /* ignore */
                }
            }

            logger.info(`[Listener] CONFIRMED: TokensClaimed ${claimId}. Sending to DB...`, 'blockchain');

            await this._sendFinalizationRequest('finalize-token-claim', 'claimId', claimId, txHash);

        } catch (error) {
            logger.error(`[Listener] Error processing TokensClaimed (Tx: ${txHash}): ${error.message}`, 'blockchain');
        }
    }

    /**
     * Отправка в БД с повторами
     */
    async _sendFinalizationRequest(command, idField, idValue, txHash) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const {dbWs, identified} = this.dbWsProvider();

            if (dbWs && identified && dbWs.readyState === 1) {
                const requestId = generateRequestId();
                const payload = {txHash};
                payload[idField] = idValue.toString();

                safeSend(dbWs, command, requestId, payload);
                return;
            }

            if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_SEND_DELAY_MS));
            }
        }

        logger.warn(`[Listener] Не удалось отправить '${command}' для ${idValue}. Оставляем для Reconciler.`, 'blockchain');
    }
}

module.exports = {BlockchainListener};
