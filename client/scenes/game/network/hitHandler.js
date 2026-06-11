import {selectTextureAndScale} from "../../core/utils";
import {EPK, RTE} from '../../core/gameStateKeys';
import {soundManager} from '../../shared/SoundManager.js';
import {DEPTHS} from "../ui/depths";

export function processEnemyDestroyed(scene, payload) {

    const enemyId = payload[EPK.ENEMY_ID];
    const loot = payload[EPK.LOOT];
    const removalType = payload[EPK.REMOVAL_TYPE];

    if (scene.processedEnemyDestroyed.has(enemyId)) {
        return;
    }
    scene.processedEnemyDestroyed.add(enemyId);

    const enemy = scene.enemiesMap.get(enemyId);
    if (!enemy) {
        return;
    }

    if (removalType === RTE.KILLED) {
        enemy.explodeAndDestroy(loot);
    } else {
        enemy.quietDestroy();
    }

    scene.enemiesMap.delete(enemyId);

}

export function createPlayerShipExplosion(scene, explosionType = 'boom_ss1') {
    if (!scene.playerShip || !scene.playerShip.sprite) {
        console.warn('Could not create explosion: playerShip or sprite is not available');
        return;
    }

    const shipSize = scene.shipConfig.shipSize.height;
    const explosionResult = selectTextureAndScale(scene, explosionType, shipSize * 8);
    const animKey = `explosion_anim_${explosionType}_${explosionResult.textureKey.split('@')[1]}`;

    if (!scene.anims.exists(animKey)) {
        console.warn(`Animation ${animKey} not found for texture ${explosionResult.textureKey}`);
        return;
    }

    const explosion = scene.add.sprite(
        scene.playerShip.sprite.x,
        scene.playerShip.sprite.y,
        explosionResult.textureKey
    )
        .setScale(explosionResult.scale)
        .setDepth(DEPTHS.EFFECTS_FOREGROUND);
    explosion.play(animKey);

    explosion.on('animationcomplete', () => {
        explosion.destroy();
        console.log('Player ship explosion animation completed');
    });

    const debris = scene.add.sprite(
        scene.playerShip.sprite.x,
        scene.playerShip.sprite.y,
        'ship_debris'
    )
        .setScale(1)
        .setDepth(4)
        .setAlpha(0);

    scene.tweens.add({
        targets: debris,
        alpha: {from: 0, to: 1},
        duration: 2000,
        ease: 'Linear',
        onComplete: () => {
            console.log('Ship debris fade-in animation completed');
        }
    });

    scene.playerShip.sprite.setVisible(false);

    if (scene.playerShip.shieldSprite) {
        scene.playerShip.shieldSprite.setVisible(false);
    }

    if (scene.playerShip.sprite.body) {
        scene.playerShip.sprite.body.setEnable(false);
    }

    if (scene.playerShip.exhaustEmitter) {
        scene.playerShip.exhaustEmitter.destroy();
        scene.playerShip.exhaustEmitter = null;
    }
}

export function createBaseExplosion(scene, explosionType = 'boom_ss1') {
    if (!scene.backgroundLayers || !scene.backgroundLayers.hangar || !scene.backgroundLayers.hangar.layer) {
        console.warn('Could not create base explosion: hangar layer is not available');
        return;
    }

    const hangar = scene.backgroundLayers.hangar.layer;
    const hangarHeight = hangar.displayHeight;
    const explosionResult = selectTextureAndScale(scene, explosionType, hangarHeight * 2);
    const animKey = `explosion_anim_${explosionType}_${explosionResult.textureKey.split('@')[1]}`;

    if (!scene.anims.exists(animKey)) {
        console.warn(`Animation ${animKey} not found for texture ${explosionResult.textureKey}`);
        return;
    }

    const explosion = scene.add.sprite(
        hangar.x,
        hangar.y,
        explosionResult.textureKey
    )
        .setScale(explosionResult.scale)
        .setDepth(5);
    explosion.play(animKey);

    explosion.on('animationcomplete', () => {
        explosion.destroy();
        console.log('Base explosion animation completed');
    });

    const brokenBaseResult = selectTextureAndScale(scene, 'base_broken', hangar.displayWidth);
    hangar.setTexture(brokenBaseResult.textureKey);
    hangar.setScale(brokenBaseResult.scale);
    hangar.setAlpha(0);

    scene.tweens.add({
        targets: hangar,
        alpha: {from: 0, to: 1},
        duration: 2000,
        ease: 'Linear',
        onComplete: () => {
            console.log('Base broken texture fade-in animation completed');
        }
    });

    if (scene.backgroundLayers.hangar.shield) {
        scene.backgroundLayers.hangar.shield.setVisible(false);
        console.log('Base shield hidden during explosion');
    }
}

export function handleBulletHit(scene, bulletId) {
    if (scene.gameState === 'ended') {
        return;
    }
    const bullet = scene.activeBulletsMap.get(bulletId);

    if (!bullet || !bullet.active) {
        return;
    }

    soundManager.playSfx('player_damaged1');

    let spawnX = bullet.x;
    let spawnY = bullet.y;
    let offsetX = 0;
    let offsetY = 0;

    const ship = scene.playerShip?.sprite;
    const shield = scene.playerShip?.shieldSprite;
    const hasShip = ship && ship.active;

    if (hasShip) {

        const targetObject = (shield && shield.visible) ? shield : ship;

        const radius = (targetObject.displayWidth / 2) * 0.95;

        const dx = bullet.x - ship.x;
        const dy = bullet.y - ship.y;

        const distSq = dx * dx + dy * dy;
        const radiusSq = radius * radius;

        if (distSq > radiusSq) {

            const angle = Math.atan2(dy, dx);
            offsetX = Math.cos(angle) * radius;
            offsetY = Math.sin(angle) * radius;
        } else {

            offsetX = dx;
            offsetY = dy;
        }

        spawnX = ship.x + offsetX;
        spawnY = ship.y + offsetY;
    }

    const hitSprite = scene.poolManager.spawn('hitEffects', spawnX, spawnY, 'hit1');

    if (hitSprite) {
        hitSprite.setDepth(DEPTHS.EFFECTS_FOREGROUND).setScale(1.5).play('hit1_anim');

        if (hasShip) {
            const updateHitPosition = () => {

                if (!hitSprite.active || !ship.active) {
                    scene.events.off('update', updateHitPosition);
                    return;
                }

                hitSprite.setPosition(
                    ship.x + offsetX,
                    ship.y + offsetY
                );
            };

            scene.events.on('update', updateHitPosition);

            hitSprite.once('animationcomplete', () => {
                scene.events.off('update', updateHitPosition);
                scene.poolManager.despawn('hitEffects', hitSprite);
            });
        } else {
            hitSprite.once('animationcomplete', () => scene.poolManager.despawn('hitEffects', hitSprite));
        }
    }

    if (shield && shield.visible) {
        scene.playerShip.blinkShield();
    }

    bullet.deactivate();
    scene.enemyBulletsBuffer.delete(bulletId);
    scene.activeBulletsMap.delete(bulletId);
}