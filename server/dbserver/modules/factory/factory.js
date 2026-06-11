const mongoose = require('mongoose');
const factoriesSchema = require('./schema');
const logger = require('../../core/logger');
const Factory = mongoose.model('Factory', factoriesSchema);

async function createFactory(wallet) {
    wallet = wallet?.toLowerCase();

    if (!wallet || typeof wallet !== 'string' || !/^0x[a-f0-9]{40}$/.test(wallet)) {
        logger.error(`Invalid wallet address provided to createFactory: ${wallet}`);
        throw new Error('Invalid wallet: must be a valid Ethereum address');
    }
    try {
        const result = await Factory.findOneAndUpdate(
            {walletAddress: wallet},
            {$setOnInsert: {walletAddress: wallet}},
            {upsert: true, new: true, runValidators: true}
        );
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {

        }
    } catch (error) {
        logger.error(`Error in createFactory for ${wallet}: ${error.message}`);
        throw error;
    }
}

async function getFactory(walletAddress, factoryName) {
    walletAddress = walletAddress?.toLowerCase();
    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        return {success: false, error: 'Invalid walletAddress'};
    }
    if (!factoryName || !['factory1', 'factory2', 'factory3'].includes(factoryName)) {
        return {success: false, error: 'Invalid factoryName'};
    }
    try {
        const factoryDoc = await Factory.findOne(
            {walletAddress},
            {[`factories.${factoryName}`]: 1, '_id': 0}
        ).lean();
        if (!factoryDoc || !factoryDoc.factories || !factoryDoc.factories[factoryName]) {
            logger.error(`Factory slot ${factoryName} not found for wallet: ${walletAddress}`, `factory_${walletAddress}`);
            return {success: false, error: 'Could not find factory slot'};
        }
        return {success: true, factory: factoryDoc.factories[factoryName]};
    } catch (error) {
        logger.error(`Error getting factory ${factoryName} for wallet ${walletAddress}: ${error.message}`, `factory_${walletAddress}`);
        return {success: false, error: 'Could not get factory'};
    }
}

async function getFactories(wallet) {
    wallet = wallet?.toLowerCase();
    if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
        return {success: false, error: 'Invalid wallet'};
    }
    try {

        const clientProjection = {
            '_id': 0,
            'factories.factory1.state': 1,
            'factories.factory1.blueprintKey': 1,
            'factories.factory1.quantity': 1,
            'factories.factory1.startTime': 1,
            'factories.factory1.endTime': 1,
            'factories.factory1.factoryUid': 1,
            'factories.factory1.timeRemainingMs': 1,
            'factories.factory2.state': 1,
            'factories.factory2.blueprintKey': 1,
            'factories.factory2.quantity': 1,
            'factories.factory2.startTime': 1,
            'factories.factory2.endTime': 1,
            'factories.factory2.factoryUid': 1,
            'factories.factory2.timeRemainingMs': 1,
            'factories.factory3.state': 1,
            'factories.factory3.blueprintKey': 1,
            'factories.factory3.quantity': 1,
            'factories.factory3.startTime': 1,
            'factories.factory3.endTime': 1,
            'factories.factory3.factoryUid': 1,
            'factories.factory3.timeRemainingMs': 1,
        };

        let factoryDoc = await Factory.findOne({walletAddress: wallet}, clientProjection).lean();

        if (!factoryDoc) {

            await createFactory(wallet);

            factoryDoc = await Factory.findOne({walletAddress: wallet}, clientProjection).lean();
        }

        const factories = factoryDoc.factories;
        for (const key in factories) {
            if (factories[key].state === 'idle') {

                factories[key] = {
                    state: 'idle',
                    factoryUid: factories[key].factoryUid
                };
            }
        }

        return {success: true, factories};

    } catch (error) {
        logger.error(`Error fetching factories for wallet ${wallet}: ${error.message}`, `factory_${wallet}`);
        return {success: false, error: 'Failed to fetch factories'};
    }
}

async function lockCraftingSlot(session, walletAddress, blueprintKey, itemToCraftQuantity, timetocraft) {
    walletAddress = walletAddress?.toLowerCase();
    try {
        const factoryDoc = await Factory.findOne({walletAddress}).session(session);
        if (!factoryDoc) throw new Error('No factories found for user.');

        const idleSlotKey = Object.keys(factoryDoc.factories.toObject()).find(
            key => factoryDoc.factories[key].state === 'idle'
        );
        if (!idleSlotKey) throw new Error('No available factory slots');

        if (typeof timetocraft !== 'number' || !Number.isFinite(timetocraft) || typeof itemToCraftQuantity !== 'number' || !Number.isFinite(itemToCraftQuantity)) {
            throw new Error(`Invalid data for time calculation`);
        }

        const startTime = Date.now();
        const endTime = startTime + (timetocraft * 1000 * itemToCraftQuantity);

        const updatedSlot = {
            state: 'crafting',
            blueprintKey,
            quantity: itemToCraftQuantity,
            startTime,
            endTime,
            timeRemainingMs: null,
            factoryUid: factoryDoc.factories[idleSlotKey].factoryUid
        };

        factoryDoc.factories[idleSlotKey] = updatedSlot;
        factoryDoc.markModified(`factories.${idleSlotKey}`);
        await factoryDoc.save({session});

        return {
            success: true,
            data: {[idleSlotKey]: {...updatedSlot}}
        };
    } catch (error) {
        logger.error(`Error in lockCraftingSlot for ${walletAddress}: ${error.message}`, `factory_${walletAddress}`);
        throw error;
    }
}

async function cancelCraftFactory(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    const {factoryName, factoryUid} = payload;

    try {

        const updateResult = await Factory.updateOne(
            {
                walletAddress,
                [`factories.${factoryName}.factoryUid`]: factoryUid,
                [`factories.${factoryName}.state`]: 'crafting'
            },
            {

                $set: {
                    [`factories.${factoryName}`]: {
                        factoryUid: factoryUid,
                        state: 'idle',
                        blueprintKey: null,
                        quantity: null,
                        startTime: null,
                        endTime: null,
                        timeRemainingMs: null
                    }
                }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return {success: false, error: 'Slot not found or conditions not met.'};
        }

        return {success: true, [factoryName]: {state: 'idle'}};
    } catch (error) {
        logger.error(`Error canceling craft for ${factoryName}: ${error.message}`, logContext);
        return {success: false, error: 'Failed to cancel craft'};
    }
}

module.exports = {
    Factory,
    createFactory,
    getFactories,
    getFactory,
    lockCraftingSlot,
    cancelCraftFactory
};
