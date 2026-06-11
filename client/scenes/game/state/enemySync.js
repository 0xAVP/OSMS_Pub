import {ESK} from '../../core/gameStateKeys';
import {interpolateObjects} from "./interpolation";

export const ENEMY_INTERPOLATION_CONFIG = {
    RENDER_DELAY_MS: 300,
    CORRECTION_FACTOR: 3.0,
    SNAP_THRESHOLD: 100.0
};

const ENEMY_DEBUG_CONFIG = {
    targetColor: 0xff0000, targetAlpha: 1, targetRadius: 6,
    spriteColor: 0x00ff00, spriteAlpha: 0.8, spriteRadius: 4
};

export function spawnEnemy(scene, enemyData, initialBufferState) {
    const enemyId = enemyData[ESK.ID];
    const enemySprite = scene.enemiesGroup.get();

    if (!enemySprite) console.warn(`[SPAWN FAILED] enemiesGroup pool is full! Could not spawn entity with typeId: ${enemyData[ESK.TYPE_ID]}`);

    if (enemySprite) {
        enemySprite.activate([
            enemyId, enemyData[ESK.TYPE_ID],
            initialBufferState.x,
            initialBufferState.y,
            enemyData[ESK.HP],
            enemyData[ESK.SIZE],
            enemyData[ESK.COLLISION_DAMAGE]
        ]);

        const initialRotation = enemyData[ESK.ROTATION];
        if (initialRotation !== undefined) {

            enemySprite.setRotation(initialRotation / 100.0);
        }

        scene.enemiesMap.set(enemyId, enemySprite);
    }
}

export function syncEnemies(scene, newEnemies, updatedEnemies, destroyedEnemyIds, serverTimestamp) {
    if (newEnemies) {
        newEnemies.forEach(enemyData => {
            const enemyId = enemyData[ESK.ID];
            if (scene.enemiesMap.has(enemyId) || scene.unspawnedEnemiesData.has(enemyId)) return;

            scene.unspawnedEnemiesData.set(enemyId, enemyData);

            const startX = enemyData[ESK.POSITION][0] / 10.0;
            const startY = enemyData[ESK.POSITION][1] / 10.0;
            const velocity = enemyData[ESK.VELOCITY] || [0, 0];

            const newBufferState = {
                timestamp: serverTimestamp,
                x: startX, y: startY,
                vx: velocity[0] / 10.0, vy: velocity[1] / 10.0,
            };

            if (enemyData[ESK.ROTATION] !== undefined) {
                newBufferState.rotation = enemyData[ESK.ROTATION];
            }

            const newBuffer = [newBufferState];
            scene.enemyBuffer.set(enemyId, newBuffer);
        });
    }

    if (updatedEnemies) {
        updatedEnemies.forEach(enemyDelta => {
            const enemyId = enemyDelta[ESK.ID];
            const buffer = scene.enemyBuffer.get(enemyId);
            if (!buffer) return;

            const lastState = buffer.length > 0 ? buffer[buffer.length - 1] : {};
            const newState = {...lastState, timestamp: serverTimestamp};

            if (enemyDelta[ESK.POSITION]) {
                newState.x = enemyDelta[ESK.POSITION][0] / 10.0;
                newState.y = enemyDelta[ESK.POSITION][1] / 10.0;
            }
            if (enemyDelta[ESK.VELOCITY]) {
                newState.vx = enemyDelta[ESK.VELOCITY][0] / 10.0;
                newState.vy = enemyDelta[ESK.VELOCITY][1] / 10.0;
            }
            if (enemyDelta[ESK.ROTATION] !== undefined) {
                newState.rotation = enemyDelta[ESK.ROTATION];
            } else {

                if (newState.rotation !== undefined && lastState.rotation === undefined) {
                    delete newState.rotation;
                }
            }

            buffer.push(newState);
            while (buffer.length > 20) {
                buffer.shift();
            }

            const enemySprite = scene.enemiesMap.get(enemyId);
            if (enemySprite) {

                if (enemyDelta[ESK.HP] !== undefined) {
                    enemySprite.hp = enemyDelta[ESK.HP];
                }
            }
        });
    }

    if (destroyedEnemyIds) {
        destroyedEnemyIds.forEach(enemyId => {
            if (scene.unspawnedEnemiesData.has(enemyId)) {
                scene.unspawnedEnemiesData.delete(enemyId);
                scene.enemyBuffer.delete(enemyId);
                return;
            }

            if (scene.enemiesMap.has(enemyId)) {
                scene.enemiesMap.get(enemyId).quietDestroy();
                scene.enemiesMap.delete(enemyId);
                scene.enemyBuffer.delete(enemyId);
            }
        });
    }
}

export function interpolateEnemies(scene) {
    if (scene.debugGraphics) scene.debugGraphics.clear();
    interpolateObjects(
        scene,
        scene.enemiesMap,
        scene.enemyBuffer,
        ENEMY_INTERPOLATION_CONFIG,
        ENEMY_DEBUG_CONFIG
    );
}