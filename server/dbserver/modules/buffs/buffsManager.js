/**
 * @file Управляет состоянием активных баффов игроков в коллекции `Buffs`.
 * Этот модуль является "исполнителем": он не имеет доступа к каталогам
 * и работает только с теми данными, которые ему передает вышестоящий
 * диспетчер (itemActionsManager).
 */

const {Buff} = require('./buffs.js');
const {Inventory} = require('../inventory/inventory.js');
const logger = require('../../core/logger.js');

/**
 * Получает все активные (не просроченные) баффы для указанного игрока из БД.
 * @param {string} walletAddress - Адрес кошелька игрока.
 * @returns {Promise<object>} - Объект с результатом операции.
 */
async function getActiveBuffs(walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    try {
        const activeBuffsArray = await Buff.find({
            walletAddress,
            $or: [{expiresAt: null}, {expiresAt: {$gt: new Date()}}]
        }).lean();

        const buffsObject = activeBuffsArray.reduce((acc, buff) => {
            acc[buff.buffId] = {
                buffId: buff.buffId,
                group: buff.group,
                expiresAt: buff.expiresAt
            };
            return acc;
        }, {});

        return {success: true, buffs: buffsObject};
    } catch (error) {
        logger.error(`Failed to get active buffs for ${walletAddress}: ${error.message}`, `buffs_${walletAddress}`);
        return {success: false, error: 'Failed to fetch buffs'};
    }
}

/**
 * Активирует бафф.
 * Выполняет атомарную транзакцию: списывает 1 шт. предмета из инвентаря
 * и создает/обновляет запись в коллекции `Buffs`.
 * @param {string} walletAddress - Адрес кошелька игрока.
 * @param {object} itemData - Данные о предмете, который нужно списать.
 * @param {object} buffDef - Данные о баффе, который нужно активировать.
 * @returns {Promise<object>} - Результат операции, включая обновленный список баффов.
 */
async function activateBuff(walletAddress, itemData, buffDef) {
    walletAddress = walletAddress?.toLowerCase();

    const {key: itemId, category: itemCategory} = itemData;
    const {buffId, group: buffGroup, durationMs, isStackable} = buffDef;

    const session = await Buff.startSession();
    try {
        let responseBuff;
        await session.withTransaction(async () => {

            const updateResult = await Inventory.updateOne(
                {
                    walletAddress,

                    [`${itemCategory}.${itemId}.quantity`]: {$gte: 1}
                },
                {
                    $inc: {[`${itemCategory}.${itemId}.quantity`]: -1}
                },
                {session}
            );

            if (updateResult.modifiedCount === 0) {
                throw new Error(`Item '${itemId}' not found in inventory or insufficient quantity.`);
            }

            const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

            if (isStackable) {

            } else {
                await Buff.updateOne(
                    {walletAddress, group: buffGroup},
                    {$set: {walletAddress, group: buffGroup, buffId, expiresAt}},
                    {upsert: true, session}
                );
            }

            responseBuff = {
                buffId,
                group: buffGroup,
                expiresAt
            };

        });

        logger.debug(`Buff '${buffId}' (group: '${buffGroup}') activated for ${walletAddress}.`, `buffs_${walletAddress}`);

        return {success: true, buff: responseBuff};

    } catch (error) {
        logger.error(`Transaction failed to activate buff from item '${itemId}': ${error.message}`, `buffs_${walletAddress}`);
        return {success: false, error: error.message};
    } finally {
        session.endSession();
    }
}

module.exports = {
    getActiveBuffs,
    activateBuff
};