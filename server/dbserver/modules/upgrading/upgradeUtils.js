function calculateRequiredResources(currentLevel, quantity, requiredItems) {

    if (!requiredItems || typeof requiredItems !== 'object' || Object.keys(requiredItems).length === 0) {
        return {success: false, error: 'Invalid upgradeData: materials must be a non-empty object'};
    }

    try {

        const fractionalResources = new Map();

        const a = 1;
        const b = 0.1;
        const c = 1.05;

        for (let i = currentLevel + 1; i <= currentLevel + quantity; i++) {

            const linearPart = a + b * (i - 1);
            const exponentialPart = Math.pow(c, i - 1);
            const multiplier = linearPart * exponentialPart;

            Object.entries(requiredItems).forEach(([itemKey, itemData]) => {
                if (!Number.isFinite(itemData.quantity) || itemData.quantity < 0 || !itemData.category) {
                    throw new Error(`Invalid data for ${itemKey}`);
                }

                const amount = itemData.quantity * multiplier;
                fractionalResources.set(itemKey, (fractionalResources.get(itemKey) || 0) + amount);
            });
        }

        const finalResources = {};
        for (const [itemKey, totalAmount] of fractionalResources.entries()) {
            finalResources[itemKey] = {
                category: requiredItems[itemKey].category,
                quantity: Math.ceil(totalAmount)
            };
        }

        return {success: true, resources: finalResources};

    } catch (error) {
        return {success: false, error: `Error calculating resources: ${error.message}`};
    }
}

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(deepClone);
    }
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

function calculateModuleParams(currentParams, initialParams, upgradableParams, upgradeParams, itemToUpgradeQuantity) {
    try {
        if (!currentParams || !initialParams || !upgradeParams || !Number.isInteger(itemToUpgradeQuantity) || itemToUpgradeQuantity < 1) {
            throw new Error('[calculateModuleParams] Invalid input parameters');
        }

        let updatedParams = deepClone(currentParams);
        const changedParams = {};

        for (let i = 0; i < itemToUpgradeQuantity; i++) {

            if (Array.isArray(upgradeParams.energyCost) && currentParams.energyCost != null) {
                const range = upgradeParams.energyCost;
                const min = Math.min(range[0], range[1]);
                const max = Math.max(range[0], range[1]);
                const percent = (Math.floor(Math.random() * (max - min + 1)) + min) / 100;
                const increase = initialParams.energyCost * percent;
                const oldValue = updatedParams.energyCost;
                updatedParams.energyCost = Math.ceil((updatedParams.energyCost + increase) * 100) / 100;
                changedParams.energyCost = updatedParams.energyCost;
                console.log(`Upgrade ${i + 1}: energyCost = ${updatedParams.energyCost} (+${updatedParams.energyCost - oldValue})`);
            }

            let paramKey;
            let attempts = 0;
            const maxAttempts = upgradableParams.length;
            let paramRange;

            do {
                paramKey = upgradableParams[Math.floor(Math.random() * upgradableParams.length)];
                attempts++;

                if (paramKey.includes('.')) {
                    const [category, subKey] = paramKey.split('.');
                    paramRange = upgradeParams[category]?.[subKey];
                } else {
                    paramRange = upgradeParams[paramKey];
                }

                if (Array.isArray(paramRange)) {
                    break;
                }
                paramKey = null;
            } while (attempts < maxAttempts && paramKey === null);

            if (!paramKey) {
                throw new Error('No valid upgradable parameters found in upgradeParams');
            }

            let category, subKey;
            if (paramKey.includes('.')) {
                [category, subKey] = paramKey.split('.');
            } else {
                category = paramKey;
                subKey = null;
            }

            const rangeMin = Math.min(paramRange[0], paramRange[1]);
            const rangeMax = Math.max(paramRange[0], paramRange[1]);
            const rangePercent = (Math.floor(Math.random() * (rangeMax - rangeMin + 1)) + rangeMin) / 100;

            let initialValue;
            if (subKey) {
                initialValue = initialParams[category][subKey];
            } else {
                initialValue = initialParams[category];
            }

            if (initialValue == null) {
                throw new Error(`Missing initialParams for ${paramKey}`);
            }

            let oldValue;
            if (subKey) {
                oldValue = updatedParams[category][subKey];
            } else {
                oldValue = updatedParams[category];
            }

            let newValue = oldValue + initialValue * rangePercent;

            if (paramKey === 'damage.min') {
                if (updatedParams.damage.min === updatedParams.damage.max) {

                    const oldMax = updatedParams.damage.max;
                    updatedParams.damage.max = Math.ceil(newValue * 100) / 100;
                    changedParams['damage.max'] = updatedParams.damage.max;
                    console.log(`Upgrade ${i + 1}: damage.max = ${updatedParams.damage.max} (+${updatedParams.damage.max - oldMax})`);
                } else if (newValue >= updatedParams.damage.max) {

                    updatedParams.damage.min = updatedParams.damage.max;
                    changedParams['damage.min'] = updatedParams.damage.min;
                    console.log(`Upgrade ${i + 1}: damage.min = ${updatedParams.damage.min} (capped to match max)`);
                } else {

                    const oldMin = updatedParams.damage.min;
                    updatedParams.damage.min = Math.ceil(newValue * 100) / 100;
                    changedParams['damage.min'] = updatedParams.damage.min;
                    console.log(`Upgrade ${i + 1}: damage.min = ${updatedParams.damage.min} (+${updatedParams.damage.min - oldMin})`);
                }
            } else if (paramKey === 'damage.max') {
                const oldMax = updatedParams.damage.max;
                updatedParams.damage.max = Math.ceil(newValue * 100) / 100;

                if (updatedParams.damage.min > updatedParams.damage.max) {
                    updatedParams.damage.min = updatedParams.damage.max;
                    changedParams['damage.min'] = updatedParams.damage.min;
                    console.log(`Upgrade ${i + 1}: damage.min = ${updatedParams.damage.min} (adjusted to match max)`);
                }
                changedParams['damage.max'] = updatedParams.damage.max;
                console.log(`Upgrade ${i + 1}: damage.max = ${updatedParams.damage.max} (+${updatedParams.damage.max - oldMax})`);
            } else {
                if (subKey) {
                    updatedParams[category][subKey] = Math.ceil(newValue * 100) / 100;
                    changedParams[`${category}.${subKey}`] = updatedParams[category][subKey];
                    console.log(`Upgrade ${i + 1}: ${paramKey} = ${updatedParams[category][subKey]} (+${updatedParams[category][subKey] - oldValue})`);
                } else {
                    updatedParams[category] = Math.ceil(newValue * 100) / 100;
                    changedParams[paramKey] = updatedParams[category];
                    console.log(`Upgrade ${i + 1}: ${paramKey} = ${updatedParams[category]} (+${updatedParams[category] - oldValue})`);
                }
            }
        }

        return {success: true, params: updatedParams, changedParams};
    } catch (error) {
        return {
            success: false,
            error: `Error calculating module params: ${error.message}`,
            code: 'PARAM_CALCULATION_ERROR'
        };
    }
}

module.exports = {calculateRequiredResources, deepClone, calculateModuleParams};