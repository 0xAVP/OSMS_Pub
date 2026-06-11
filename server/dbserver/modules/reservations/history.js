const Reservation = require('./schema');
const SHIP_TYPES = require('../ships/shipTypes');

/**
 * Получает историю транзакций с фильтрацией.
 * @param {string} walletAddress
 * @param {string} category - 'tokens' | 'ships' | null (если null, вернет всё)
 * @param {number} limit
 * @param {number} offset
 */
async function getReservationHistory(walletAddress, category = null, limit = 50, offset = 0) {
    walletAddress = walletAddress?.toLowerCase();

    const query = {walletAddress};

    if (category === 'tokens') {
        query.type = 'TOKEN_CLAIM';
    } else if (category === 'ships') {
        query.type = 'SHIP_CRAFT';
    }

    try {
        const reservations = await Reservation.find(query)
            .sort({createdAt: -1})
            .skip(offset)
            .limit(limit)
            .lean();

        const formattedHistory = reservations.map(res => {
            const item = {
                id: res.reservationId,
                type: res.type,
                status: res.status,
                createdAt: res.createdAt,
                transactionHash: res.transactionHash || null,
            };

            if (res.type === 'TOKEN_CLAIM') {
                item.coinsAmount = res.coinsAmount || 0;
                item.epoch = res.epoch;
            }

            if (res.type === 'SHIP_CRAFT') {

                if (res.shipTypeId !== undefined) {
                    const shipData = SHIP_TYPES[res.shipTypeId];
                    item.shipName = shipData ? shipData.name : `Unknown Ship (${res.shipTypeId})`;
                }
            }

            return item;
        });

        return {success: true, history: formattedHistory};

    } catch (error) {
        console.error(`Error fetching history for ${walletAddress} (cat: ${category}):`, error);
        return {success: false, error: 'Failed to fetch transaction history'};
    }
}

module.exports = {getReservationHistory};