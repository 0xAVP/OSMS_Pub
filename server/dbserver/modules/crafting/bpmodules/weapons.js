const {v4: uuidv4} = require('uuid');
const logger = require('../../../core/logger');

async function processWeapon(itemCrafted) {
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

        const damage = craftParams.damage
            ? {
                min: getRandomFloat(craftParams.damage.min),
                max: getRandomFloat(craftParams.damage.max)
            }
            : null;

        const fireRate = craftParams.fireRate ? getRandomInt(craftParams.fireRate) : null;

        const critical = craftParams.critical
            ? {
                chance: getRandomFloat(craftParams.critical.chance),
                modifier: getRandomInt(craftParams.critical.modifier)
            }
            : null;

        const energyCost = getRandomFloat(craftParams.energyCost);

        const params = {
            damage,
            fireRate,
            critical,
            energyCost,
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
        return {success: false, error: `Weapon processing failure!`};
    }
}

module.exports = {processWeapon};