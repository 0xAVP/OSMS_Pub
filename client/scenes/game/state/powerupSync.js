import {PWRSK} from '../../core/gameStateKeys';
import {POWERUP_TYPES} from '../objects/powerups/powerupTypes';
import {selectTextureAndScale} from '../../core/utils';

/**
 * Обрабатывает данные о новых и уничтоженных паверапах, полученные от сервера.
 * @param {Phaser.Scene} scene - Текущая игровая сцена.
 * @param {Array} newPowerUps - Массив данных о новых паверапах.
 * @param {Array} destroyedPowerUpIds - Массив ID уничтоженных паверапов.
 */
export function syncPowerups(scene, newPowerUps, destroyedPowerUpIds) {

    if (!scene.powerupsMap) {
        scene.powerupsMap = new Map();
    }

    if (newPowerUps) {
        newPowerUps.forEach(powerupData => {
            const id = powerupData[PWRSK.ID];

            if (scene.powerupsMap.has(id)) {
                return;
            }

            const typeId = powerupData[PWRSK.TYPE_ID];
            const powerupConfig = POWERUP_TYPES[typeId];

            if (!powerupConfig) {
                console.warn(`[syncPowerups] Received unknown powerup typeId: ${typeId}`);
                return;
            }

            const powerupSprite = scene.poolManager.spawn('powerups');
            if (!powerupSprite) {
                console.warn('[syncPowerups] Powerups pool is empty!');
                return;
            }

            const position = powerupData[PWRSK.POSITION];
            const size = powerupData[PWRSK.SIZE];

            const {textureKey, scale} = selectTextureAndScale(scene, powerupConfig.texture, size[0]);

            powerupSprite.activate({
                id: id,
                typeId: typeId,
                x: position[0],
                y: position[1],
                texture: textureKey,
                scale: scale
            });

            scene.powerupsMap.set(id, powerupSprite);
        });
    }

    if (destroyedPowerUpIds) {
        destroyedPowerUpIds.forEach(id => {
            const powerupSprite = scene.powerupsMap.get(id);
            if (powerupSprite) {
                powerupSprite.deactivate();
                scene.powerupsMap.delete(id);
            }
        });
    }
}
