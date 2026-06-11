import {BSK} from '../../core/gameStateKeys';
import {BULLETS} from '../objects/bullets';
import {interpolateObjects} from "./interpolation";

export const BULLET_INTERPOLATION_CONFIG = {
    RENDER_DELAY_MS: 300,
    CORRECTION_FACTOR: 3.0,
    SNAP_THRESHOLD: 50.0
};

const BULLET_DEBUG_CONFIG = {
    targetColor: 0xff8888, targetAlpha: 0.8, targetRadius: 4,
    spriteColor: 0x88ff88, spriteAlpha: 0.8, spriteRadius: 2
};

export function spawnBullet(scene, bulletData, initialBufferState) {
    const bulletId = bulletData[BSK.ID];
    const bulletType = bulletData[BSK.TYPE];
    const poolKey = `enemy_bullet_${bulletType}`;
    const bullet = scene.poolManager.spawn(poolKey);

    if (bullet) {
        bullet.bulletType = bulletType;
        scene.activeBulletsMap.set(bulletId, bullet);

        const bulletConfig = BULLETS.enemy[bulletType];
        const size = bulletData[BSK.SIZE];
        const scaleX = size[0] / (bulletConfig?.frameWidth || 32);
        const scaleY = size[1] / (bulletConfig?.frameHeight || 32);

        bullet.fire({
            uniqueId: bulletId,
            x: initialBufferState.x, y: initialBufferState.y,
            velocityX: 0, velocityY: 0,
            scaleX: scaleX, scaleY: scaleY,
            bulletConfig: bulletConfig
        });
        if (bullet.body) bullet.body.setAllowGravity(false);
    }
}

export function syncBullets(scene, newBullets, updatedBullets, destroyedBulletIds, serverTimestamp) {
    if (newBullets) {
        newBullets.forEach(bulletData => {
            const bulletId = bulletData[BSK.ID];
            if (scene.activeBulletsMap.has(bulletId) || scene.unspawnedBulletsData.has(bulletId)) return;

            scene.unspawnedBulletsData.set(bulletId, bulletData);

            const position = bulletData[BSK.POSITION];
            const velocity = bulletData[BSK.VELOCITY] || [0, 0];
            const newBuffer = [{
                timestamp: serverTimestamp,
                x: position[0] / 10.0, y: position[1] / 10.0,
                vx: velocity[0] / 10.0, vy: velocity[1] / 10.0
            }];
            scene.enemyBulletsBuffer.set(bulletId, newBuffer);
        });
    }

    if (updatedBullets) {
        updatedBullets.forEach(delta => {
            const bulletId = delta[BSK.ID];
            const buffer = scene.enemyBulletsBuffer.get(bulletId);
            if (!buffer) return;

            const lastState = buffer[buffer.length - 1];
            const newState = {...lastState, timestamp: serverTimestamp};

            if (delta[BSK.POSITION]) {
                newState.x = delta[BSK.POSITION][0] / 10.0;
                newState.y = delta[BSK.POSITION][1] / 10.0;
            }
            if (delta[BSK.VELOCITY]) {
                newState.vx = delta[BSK.VELOCITY][0] / 10.0;
                newState.vy = delta[BSK.VELOCITY][1] / 10.0;
            }

            buffer.push(newState);
            while (buffer.length > 20) {
                buffer.shift();
            }
        });
    }

    if (destroyedBulletIds) {
        destroyedBulletIds.forEach(id => {
            if (scene.unspawnedBulletsData.has(id)) {
                scene.unspawnedBulletsData.delete(id);
                scene.enemyBulletsBuffer.delete(id);
                return;
            }

            const bullet = scene.activeBulletsMap.get(id);
            if (bullet) {
                bullet.deactivate();
                scene.activeBulletsMap.delete(id);
                scene.enemyBulletsBuffer.delete(id);
            }
        });
    }
}

export function interpolateEnemyBullets(scene) {
    interpolateObjects(
        scene,
        scene.activeBulletsMap,
        scene.enemyBulletsBuffer,
        BULLET_INTERPOLATION_CONFIG,
        BULLET_DEBUG_CONFIG
    );
}