const logger = require("../../core/logger");

function enhanceEnemy(baseEnemyConfig, session) {
    try {

        if (baseEnemyConfig.isIndestructible) {
            return {
                hp: baseEnemyConfig.hp,
                speed: Math.round(baseEnemyConfig.speed * session.speedScaleFactor),
                collisionDamage: baseEnemyConfig.collisionDamage,
                weapons: baseEnemyConfig.weapons
            };
        }

        const stageNumber = session.currentStageNumber || 1;
        const waveNumber = session.currentWave?.wave || 1;

        const mapMultipliers = {
            0: 1.0,
            1: 3.0,
            2: 6.0
        };

        const mapMultiplier = mapMultipliers[session.map] || 1.0;
        const stageWaveMultiplier = 1 + ((stageNumber - 1) * 0.25) + (waveNumber * 0.05);
        const difficultyMultiplier = stageWaveMultiplier * mapMultiplier;

        const finalHp = Math.floor(baseEnemyConfig.hp * difficultyMultiplier);
        const finalCollisionDamage = Math.floor(baseEnemyConfig.collisionDamage * difficultyMultiplier);

        const finalWeapons = baseEnemyConfig.weapons
            ? baseEnemyConfig.weapons.map(entry => {
                const weapon = {...entry.weapon};
                weapon.bulletDamage = Math.floor(weapon.bulletDamage * difficultyMultiplier);

                if (typeof weapon.bulletSpeed === 'number') {
                    weapon.bulletSpeed = Math.round(weapon.bulletSpeed * session.speedScaleFactor);
                }
                if (weapon.bulletSize) {
                    weapon.bulletSize = {
                        width: Math.round(weapon.bulletSize.width * session.sizeScaleFactor),
                        height: Math.round(weapon.bulletSize.height * session.sizeScaleFactor)
                    };
                }
                return {...entry, weapon};
            })
            : null;

        return {
            hp: finalHp,

            speed: Math.round(baseEnemyConfig.speed * session.speedScaleFactor),
            collisionDamage: finalCollisionDamage,
            weapons: finalWeapons
        };

    } catch (error) {
        logger.error(`[ENEMYENCHANCER] CRITICAL: Failed to calculate stats. Error: ${error.message}`);

        return {
            hp: baseEnemyConfig.hp,
            speed: Math.round(baseEnemyConfig.speed * session.speedScaleFactor),
            collisionDamage: baseEnemyConfig.collisionDamage,
            weapons: baseEnemyConfig.weapons
        };
    }
}

module.exports = {enhanceEnemy};