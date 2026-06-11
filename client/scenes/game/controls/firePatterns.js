import {BULLETS} from '../objects/bullets';
import {soundManager} from '../../shared/SoundManager.js';
import Phaser from 'phaser';
import {CAK} from '../../core/gameStateKeys';

function queueFireActionToServer(scene, position, now) {
    if (!scene.ws || scene.ws.readyState !== WebSocket.OPEN) {
        return;
    }

    const fireActionArray = scene.poolManager.spawn('playerActions');
    if (!fireActionArray) {
        console.warn("[firePatterns] Action pool is empty!");
        return;
    }
    const serverTime = Date.now() - (scene.timeOffset || 0);

    const actionId = scene.actionIdCounter;
    const bulletSpawnX = scene.playerShip.sprite.x + scene.shipConfig.shipSize.width / 2;
    const bulletSpawnY = scene.playerShip.sprite.y;

    console.log(
        `[CLIENT_FIRE] actionId: ${actionId} | ` +
        `PlayerPos: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}) | ` +
        `BulletSpawn: (${bulletSpawnX.toFixed(2)}, ${bulletSpawnY.toFixed(2)})`
    );

    fireActionArray[CAK.X_COORD] = position.x;
    fireActionArray[CAK.Y_COORD] = position.y;
    fireActionArray[CAK.TIMESTAMP] = serverTime;
    fireActionArray[CAK.ACTION_ID] = scene.actionIdCounter++;
    fireActionArray[CAK.FIRE] = 1;

    scene.usedActions.push(fireActionArray);
}

/**
 * Паттерн для одиночного выстрела.
 */
function single(scene, sprite, activeWeapon, now, position) {
    const bulletType = activeWeapon.bullet.type;
    const poolKey = `player_bullet_${bulletType}`;
    const bullet = scene.poolManager.spawn(poolKey);

    if (!bullet) return;

    const bulletConfig = BULLETS.player[bulletType];
    const bulletId = scene.localBulletIdCounter++;

    bullet.originActionId = scene.actionIdCounter;
    bullet.pelletIndex = 0;

    bullet.pierceLimit = activeWeapon.bullet.pierce || 1;
    bullet.hitCount = 0;
    bullet.hitEnemies = new Set();

    bullet.bulletType = bulletType;
    scene.activePlayerBulletsMap.set(bulletId, bullet);

    bullet.fire({
        uniqueId: bulletId,
        x: sprite.x + scene.shipConfig.shipSize.width / 2,
        y: sprite.y,
        velocityX: activeWeapon.bullet.speed,
        velocityY: 0,
        scaleX: activeWeapon.bullet.size.width / bulletConfig.frameWidth,
        scaleY: activeWeapon.bullet.size.height / bulletConfig.frameHeight,
        bulletConfig: bulletConfig
    });

    if (bulletConfig?.sound?.key) soundManager.playSfx(bulletConfig.sound.key);
    queueFireActionToServer(scene, position, now);
}

/**
 * Паттерн для веерного выстрела (дробовик).
 */
function spread(scene, sprite, activeWeapon, now, position) {

    const bulletConfig = BULLETS.player[activeWeapon.bullet.type];
    const poolKey = `player_bullet_${activeWeapon.bullet.type}`;

    const params = activeWeapon.firePatternParams;
    const bulletCount = params.bulletCount;
    const spreadRad = Phaser.Math.DegToRad(params.spreadAngle);
    const bulletSpeed = activeWeapon.bullet.speed;
    const startX = sprite.x + scene.shipConfig.shipSize.width / 2;
    const startY = sprite.y;
    const scaleX = activeWeapon.bullet.size.width / bulletConfig.frameWidth;
    const scaleY = activeWeapon.bullet.size.height / bulletConfig.frameHeight;

    const originActionId = scene.actionIdCounter;

    const angleStep = bulletCount > 1 ? spreadRad / (bulletCount - 1) : 0;
    const startAngle = -spreadRad / 2;

    for (let i = 0; i < bulletCount; i++) {
        const pellet = scene.poolManager.spawn(poolKey);
        if (!pellet) break;

        pellet.originActionId = originActionId;
        pellet.pelletIndex = i;

        pellet.pierceLimit = activeWeapon.bullet.pierce || 1;
        pellet.hitCount = 0;
        pellet.hitEnemies = new Set();

        const angle = startAngle + i * angleStep;
        const uniqueId = scene.localBulletIdCounter++;

        pellet.bulletType = activeWeapon.bullet.type;
        scene.activePlayerBulletsMap.set(uniqueId, pellet);

        pellet.fire({
            uniqueId: uniqueId,
            x: startX, y: startY,
            velocityX: bulletSpeed * Math.cos(angle),
            velocityY: bulletSpeed * Math.sin(angle),
            scaleX: scaleX, scaleY: scaleY,
            bulletConfig: bulletConfig
        });
    }

    if (bulletConfig?.sound?.key) soundManager.playSfx(bulletConfig.sound.key);

    queueFireActionToServer(scene, position, now);
}

export const playerFirePatterns = {
    single,
    spread,
};