const {v4: uuidv4} = require('uuid');
const logger = require('../../../core/logger');

async function processEngine(itemCrafted) {
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

        const energy = craftParams.energy
            ? {
                capacity: getRandomInt(craftParams.energy.capacity),
                regen: getRandomFloat(craftParams.energy.regen)
            }
            : null;

        const evasion = getRandomFloat(craftParams.evasion)
        const speed = craftParams.speed;

        const params = {
            speed,
            energy,
            evasion
        };

        const module = {
            uid: uuidv4(),
            level: 1,
            category: 'modules',
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
        return {success: false, error: `Engine processing failure!`};
    }
}

module.exports = {processEngine};