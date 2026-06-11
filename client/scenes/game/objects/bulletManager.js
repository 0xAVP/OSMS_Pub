import {CONFIG} from '../../core/config';
import {BULLETS} from './bullets';
import {Bullet} from './Bullet';

/**
 * Создает пулы для пуль врагов. Вызывается один раз при старте сцены.
 */
export function initEnemyBulletPools(scene) {
    Object.keys(BULLETS.enemy).forEach(bulletKey => {
        const bulletConfig = BULLETS.enemy[bulletKey];
        const poolKey = `enemy_bullet_${bulletKey}`;

        if (scene.poolManager.pools.has(poolKey)) return;

        scene.poolManager.createPool(poolKey, {
            classType: Bullet,
            isPhysicsGroup: true,
            maxSize: CONFIG.client.pools.ENEMY_BULLET_SIZE,
            createCallback: (bullet) => {
                bullet.init(bulletConfig, poolKey);
            },
            "createMultiple.key": bulletConfig.texture,
            "createMultiple.quantity": CONFIG.client.pools.ENEMY_BULLET_SIZE
        });
    });
}

/**
 * Создает пулы ТОЛЬКО для тех пуль, которые использует игрок.
 * @param {Phaser.Scene} scene - Текущая сцена.
 * @param {object} weaponsConfig - Конфигурация оружия игрока (scene.shipConfig.weapon).
 */
export function createPlayerBulletPools(scene, weaponsConfig) {
    const requiredBulletTypes = new Set();

    if (weaponsConfig.weapon1 && weaponsConfig.weapon1.bullet) {
        requiredBulletTypes.add(weaponsConfig.weapon1.bullet.type);
    }
    if (weaponsConfig.weapon2 && weaponsConfig.weapon2.bullet) {
        requiredBulletTypes.add(weaponsConfig.weapon2.bullet.type);
    }

    console.log(`[Optimization] Required player bullet pools:`, Array.from(requiredBulletTypes));

    requiredBulletTypes.forEach(bulletKey => {
        const bulletConfig = BULLETS.player[bulletKey];
        if (!bulletConfig) {
            console.warn(`Bullet config for type "${bulletKey}" not found in BULLETS.player.`);
            return;
        }

        const poolKey = `player_bullet_${bulletKey}`;

        if (scene.poolManager.pools.has(poolKey)) return;

        scene.poolManager.createPool(poolKey, {
            classType: Bullet,
            isPhysicsGroup: true,
            maxSize: CONFIG.client.pools.PLAYER_BULLET_SIZE,
            createCallback: (bullet) => {
                bullet.init(bulletConfig, poolKey);
            },
            "createMultiple.key": bulletConfig.texture,
            "createMultiple.quantity": CONFIG.client.pools.PLAYER_BULLET_SIZE
        });
    });
}