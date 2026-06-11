function deepMerge(base, overrides) {
    const result = {...base};
    for (const key in overrides) {
        if (overrides.hasOwnProperty(key)) {
            if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key]) &&
                typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key])) {
                result[key] = deepMerge(result[key], overrides[key]);
            } else {
                result[key] = overrides[key];
            }
        }
    }
    return result;
}

/**
 * Собирает финальный объект ENEMIES.
 * Теперь он не принимает вторым аргументом `archetypes`.
 * @param {object} definitions - Объект с определениями врагов, где `archetype` - это сам объект.
 * @returns {object} Финальный, "плоский" объект ENEMIES.
 */
function buildEnemies(definitions) {
    const finalEnemies = {};

    for (const id in definitions) {
        const definition = definitions[id];

        const baseArchetype = definition.archetype;

        if (!baseArchetype) {
            console.warn(`Definition for enemy ID ${id} is missing an archetype. Skipping.`);
            continue;
        }

        const finalEnemy = deepMerge(baseArchetype, definition);
        delete finalEnemy.archetype;
        finalEnemies[id] = finalEnemy;
    }

    return finalEnemies;
}

module.exports = {buildEnemies};