const schedule = require('node-schedule');
const WebSocket = require('ws');
const {Player} = require('./player/player');
const {clients} = require('./handler');
const {safeSend} = require('../core/utils');
const logger = require('../core/logger');

const startExpNotifier = () => {

    schedule.scheduleJob('30 */1 * * * *', async () => {

        const onlineWallets = [];
        for (const clientInfo of clients.values()) {
            if (clientInfo.clientType === 'client' && clientInfo.walletAddress) {
                onlineWallets.push(clientInfo.walletAddress);
            }
        }

        if (onlineWallets.length === 0) {
            logger.debug('ExpNotifier: No clients online, skipping EXP check.');
            return;
        }

        try {

            const playersWithExp = await Player.find(
                {walletAddress: {$in: onlineWallets}},
                'walletAddress exp'
            ).lean();

            const expMap = new Map(playersWithExp.map(player => [player.walletAddress, player.exp]));

            let notifiedCount = 0;

            for (const [ws, clientInfo] of clients) {

                if (clientInfo.clientType === 'client') {

                    const currentExp = expMap.get(clientInfo.walletAddress);

                    if (currentExp !== undefined) {
                        safeSend(ws, null, 'actual-exp', {
                            success: true,
                            exp: currentExp
                        });
                        notifiedCount++;
                    }
                }
            }

            if (notifiedCount > 0) {
                logger.debug(`ExpNotifier: Sent actual-exp to ${notifiedCount} client(s) using a single DB query.`);
            }

        } catch (error) {
            logger.error(`Error in optimized ExpNotifier scheduler: ${error.message}`, 'exp_notifier');
        }
    });

    logger.info('Optimized Exp Notifier scheduler started', 'exp_notifier');
};

module.exports = {startExpNotifier};