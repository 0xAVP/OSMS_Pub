const mongoose = require('mongoose');
const crypto = require('crypto');
const {Inventory} = require('../inventory/inventory');
const Reservation = require('./reservationSchema');
const SHIP_TYPES = require('./shipTypes');
const {v4: uuidv4} = require('uuid');
const logger = require('../../core/logger');
const {logCraftAttempt} = require('../../core/auditLogger');

const RESERVATION_LIFETIME_MS = 30 * 60 * 1000;

async function reserveItemsForShipCraft(walletAddress, shipTypeId) {
    walletAddress = walletAddress?.toLowerCase();
    const traceId = uuidv4();
    const logContext = {traceId, walletAddress, shipTypeId};

    logCraftAttempt('CRAFT_INITIATED', logContext);

    const shipTypeData = SHIP_TYPES[shipTypeId];
    const requiredItems = shipTypeData?.craftingRequirements;

    if (!requiredItems || Object.keys(requiredItems).length === 0) {
        const errorMsg = `No crafting requirements found for shipTypeId ${shipTypeId}`;
        logCraftAttempt('RESERVATION_FAILED', {...logContext, details: {error: errorMsg}});

        logger.error(`[reserveItemsForShipCraft] ${errorMsg}`, `craft_logic`);
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
                if (!category || !quantity) {
                    throw new Error(`Invalid crafting requirement format for ${itemKey}`);
                }
                const fieldPath = `${category}.${itemKey}.quantity`;
                queryConditions[fieldPath] = {$gte: quantity};
                updates.$inc[fieldPath] = -quantity;

                itemsToReserve[itemKey] = {quantity, category};
            }

            const updateResult = await Inventory.updateOne(queryConditions, updates, {session});

            if (updateResult.matchedCount === 0) {
                logCraftAttempt('VALIDATION_FAILED', {
                    ...logContext,
                    details: {
                        reason: "Insufficient resources",
                        requiredItems: itemsToReserve
                    }
                });
                throw new Error('Insufficient resources for crafting.');
            }
            logger.debug(`Items successfully deducted from inventory for ${walletAddress}: ${JSON.stringify(itemsToReserve)}`, logContext);

            const craftId = '0x' + crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + RESERVATION_LIFETIME_MS);

            const reservation = new Reservation({
                craftId,
                walletAddress,
                shipTypeId,
                status: 'RESERVED',
                expiresAt,
                items: itemsToReserve
            });

            await reservation.save({session});

            logCraftAttempt('RESERVATION_SUCCESS', {
                ...logContext,
                details: {craftId, items: itemsToReserve}
            });

            result = {success: true, craftId: craftId};
        });

        return result;

    } catch (error) {
        const errorMessage = error.message || 'Unknown transaction error';

        if (!errorMessage.includes('Insufficient resources')) {
            logCraftAttempt('RESERVATION_FAILED', {
                ...logContext,
                details: {error: errorMessage}
            });

            logger.error(`[reserveItemsForShipCraft] Transaction failed for traceId ${traceId}: ${errorMessage}`, `craft_transaction`);
        }

        return {success: false, error: errorMessage};
    } finally {
        await session.endSession();
    }
}

async function finalizeShipCraft(craftId, txHash) {
    const logContext = `finalize_craft_${craftId}`;

    if (!craftId || !txHash) {
        return {success: false, error: 'craftId and txHash are required'};
    }

    try {

        const updatedReservation = await Reservation.findOneAndUpdate(
            {craftId: craftId, status: 'RESERVED'},
            {$set: {status: 'FINALIZED', transactionHash: txHash}},
            {new: true}
        ).lean();

        if (updatedReservation) {

            logCraftAttempt('FINALIZATION_SUCCESS', {
                walletAddress: updatedReservation.walletAddress,
                shipTypeId: updatedReservation.shipTypeId,
                craftId: craftId,
                details: {transactionHash: txHash}
            });
            return {success: true, reservation: updatedReservation};
        } else {

            const existing = await Reservation.findOne({craftId}).lean();
            logger.warn(`[finalizeShipCraft] Could not finalize ${craftId}. Current state: ${existing?.status || 'Not Found'}.`, logContext);
            return {success: false, message: `Reservation not found in 'RESERVED' state.`};
        }
    } catch (error) {

        logger.error(`[finalizeShipCraft] DB error for ${craftId}: ${error.message}`, logContext);
        return {success: false, error: 'Database error during finalization.'};
    }
}

module.exports = {reserveItemsForShipCraft, finalizeShipCraft};