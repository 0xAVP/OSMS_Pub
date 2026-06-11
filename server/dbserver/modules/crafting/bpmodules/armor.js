const {v4: uuidv4} = require('uuid');
const logger = require('../../../core/logger');

async function processArmor(itemCrafted) {
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

        const armor = craftParams.armor
            ? {
                capacity: getRandomInt(craftParams.armor.capacity)
            }
            : null;

        const absorption = craftParams.absorption
            ? {
                chance: getRandomFloat(craftParams.absorption.chance),
                absorb: getRandomInt(craftParams.absorption.absorb)
            }
            : null;

        const params = {
            armor,
            absorption
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
        return {success: false, error: `Armor processing failure!`};
    }
}

module.exports = {processArmor};