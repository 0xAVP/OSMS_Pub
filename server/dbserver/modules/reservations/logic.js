const mongoose = require('mongoose');
const crypto = require('crypto');
const {Inventory} = require('../inventory/inventory');
const Reservation = require('./schema');
const SHIP_TYPES = require('../ships/shipTypes');
const {v4: uuidv4} = require('uuid');
const logger = require('../../core/logger');
const redis = require('../../core/redisClient');
const {logCraftAttempt} = require('../../core/auditLogger');

const RESERVATION_LIFETIME_MS = 12 * 60 * 1000;

/**
 * Резервирует ресурсы для крафта корабля.
 */
async function reserveResourcesForShipCraft(walletAddress, shipTypeId) {
    walletAddress = walletAddress?.toLowerCase();
    const traceId = uuidv4();
    const logContext = {traceId, walletAddress, shipTypeId, type: 'SHIP_CRAFT'};

    logCraftAttempt('RESERVATION_INITIATED', logContext);

    const shipTypeData = SHIP_TYPES[shipTypeId];
    const requiredItems = shipTypeData?.craftingRequirements;

    if (!requiredItems || Object.keys(requiredItems).length === 0) {
        const errorMsg = `No crafting requirements found for shipTypeId ${shipTypeId}`;
        logger.error(`[Reservation] ${errorMsg}`, `craft_logic`);
        return {success: false, error: errorMsg};
    }

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {

            const queryConditions = {walletAddress};
            const updates = {$inc: {}};
            const itemsToReserve = {};

            for (const [itemKey, data] of Object.entries(requiredItems)) {
                const {category, quantity} = data;
                const fieldPath = `${category}.${itemKey}.quantity`;

                queryConditions[fieldPath] = {$gte: quantity};
                updates.$inc[fieldPath] = -quantity;

                itemsToReserve[itemKey] = {quantity, category};
            }

            const updateResult = await Inventory.updateOne(queryConditions, updates, {session});

            if (updateResult.matchedCount === 0) {
                logCraftAttempt('VALIDATION_FAILED', {
                    ...logContext,
                    details: {reason: "Insufficient resources", required: itemsToReserve}
                });
                throw new Error('Insufficient resources for crafting.');
            }

            const reservationId = '0x' + crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + RESERVATION_LIFETIME_MS);

            const reservation = new Reservation({
                reservationId,
                type: 'SHIP_CRAFT',
                walletAddress,
                shipTypeId,
                status: 'RESERVED',
                expiresAt,
                items: itemsToReserve
            });

            await reservation.save({session});

            logCraftAttempt('RESERVATION_SUCCESS', {
                ...logContext,
                reservationId,
                details: {items: itemsToReserve}
            });

            result = {success: true, craftId: reservationId};
        });

        return result;

    } catch (error) {
        const errorMessage = error.message || 'Unknown reservation error';
        if (!errorMessage.includes('Insufficient resources')) {
            logger.error(`[Reservation] Ship craft failed: ${errorMessage}`, logContext);
        }
        return {success: false, error: errorMessage};
    } finally {
        await session.endSession();
    }
}

async function reserveResourcesForTokenClaim(walletAddress, coinsAmount, epoch) {
    walletAddress = walletAddress?.toLowerCase();
    const traceId = uuidv4();
    const logContext = {traceId, walletAddress, coinsAmount, epoch, type: 'TOKEN_CLAIM'};

    const costInCoins = parseInt(coinsAmount);
    if (isNaN(costInCoins) || costInCoins <= 0) {
        return {success: false, error: 'Invalid coins amount'};
    }

    if (!epoch || typeof epoch !== 'number' || epoch < 1) {
        logger.error(`[Reservation] Security Alert: Invalid epoch provided: ${epoch}`, logContext);

        logCraftAttempt('VALIDATION_FAILED', {
            ...logContext,
            details: {reason: "Invalid Epoch", receivedEpoch: epoch}
        });

        return {success: false, error: 'Critical: Invalid epoch data received. Transaction rejected.'};
    }

    logger.debug(`[Reservation] Списываем коины: ${costInCoins}`);

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {

            const category = 'other';
            const itemKey = 'osms_coin';
            const coinPath = `${category}.${itemKey}.quantity`;

            const updateResult = await Inventory.updateOne(
                {
                    walletAddress,
                    [coinPath]: {$gte: costInCoins}
                },
                {
                    $inc: {[coinPath]: -costInCoins}
                },
                {session}
            );

            if (updateResult.matchedCount === 0) {

                logCraftAttempt('VALIDATION_FAILED', {
                    ...logContext,
                    details: {reason: "Insufficient OSMS Coins", required: costInCoins, epoch: epoch}
                });

                throw new Error(`Insufficient OSMS Coins. Required: ${costInCoins} (Rate: 1:${epoch})`);
            }

            const reservationId = '0x' + crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + RESERVATION_LIFETIME_MS);

            const itemsToReserve = {
                'osms_coin': {quantity: costInCoins, category: 'other'}
            };

            const reservation = new Reservation({
                reservationId,
                type: 'TOKEN_CLAIM',
                walletAddress,
                coinsAmount: costInCoins,
                epoch: epoch,
                status: 'RESERVED',
                expiresAt,
                items: itemsToReserve
            });

            await reservation.save({session});

            logCraftAttempt('RESERVATION_SUCCESS', {
                ...logContext,
                reservationId,
                details: {cost: costInCoins, epoch: epoch}
            });

            result = {success: true, claimId: reservationId};
        });

        return result;

    } catch (error) {
        const errorMessage = error.message || 'Unknown reservation error';
        if (!errorMessage.includes('Insufficient')) {
            logger.error(`[Reservation] Token claim failed: ${errorMessage}`, logContext);
        }
        return {success: false, error: errorMessage};
    } finally {
        await session.endSession();
    }
}

/**
 * Универсальная финализация.
 * Переводит статус в FINALIZED при успехе в блокчейне.
 */
async function finalizeReservation(reservationId, txHash) {
    const logContext = `finalize_${reservationId}`;

    if (!reservationId || !txHash) {
        return {success: false, error: 'reservationId and txHash are required'};
    }

    try {
        const updatedReservation = await Reservation.findOneAndUpdate(
            {reservationId: reservationId, status: 'RESERVED'},
            {$set: {status: 'FINALIZED', transactionHash: txHash}},
            {new: true}
        ).lean();

        if (updatedReservation) {
            logCraftAttempt('FINALIZATION_SUCCESS', {
                reservationId,
                type: updatedReservation.type,
                wallet: updatedReservation.walletAddress,
                tx: txHash
            });

            if (redis.redisClient && redis.redisClient.isOpen) {
                await redis.redisClient.publish('tx-history-events', JSON.stringify({
                    event: 'tx-history_updated',
                    walletAddress: updatedReservation.walletAddress
                }));
            }

            return {success: true, reservation: updatedReservation};
        } else {

            const existing = await Reservation.findOne({reservationId}).lean();
            if (existing && existing.status === 'FINALIZED') {
                return {success: true, message: 'Already finalized'};
            }

            logger.warn(`[Reservation] Could not finalize ${reservationId}. Status: ${existing?.status || 'Not Found'}`, logContext);
            return {success: false, message: `Reservation not found or not in RESERVED state.`};
        }
    } catch (error) {
        logger.error(`[Reservation] DB error finalizing ${reservationId}: ${error.message}`, logContext);
        return {success: false, error: 'Database error during finalization.'};
    }
}

module.exports = {
    reserveResourcesForShipCraft,
    reserveResourcesForTokenClaim,
    finalizeReservation
};