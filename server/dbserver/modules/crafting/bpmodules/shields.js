const {v4: uuidv4} = require('uuid');
const logger = require('../../../core/logger');

async function processShield(itemCrafted) {
    try {

        const {craftParams} = itemCrafted;

        const getRandomInt = (range) => {
            if (!Array.isArray(range) || range.length !== 2) {
                return range;
            }
            const [min, max] = range;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        const getRandomFloat = (range) => {
            if (!Array.isArray(range) || range.length !== 2) {
                return range;
            }
            const [min, max] = range;
            const randomValue = Math.random() * (max - min) + min;
            return Number(randomValue.toFixed(2));
        };

        const shield = craftParams.shield
            ? {
                capacity: getRandomInt(craftParams.shield.capacity),
                regen: getRandomFloat(craftParams.shield.regen),
                delay: getRandomInt(craftParams.shield.delay)
            }
            : null;

        const params = {
            shield
        };

        const module = {
            uid: uuidv4(),
            level: 1,
            category: "modules",
            params,
            initialParams: {...params}
        };

        return {
            success: true,
            data: {
                module
            }
        };
    } catch (error) {
        return {success: false, error: `Shield processing failure!`};
    }
}

module.exports = {processShield};