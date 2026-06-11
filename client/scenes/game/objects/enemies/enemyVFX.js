import {selectTextureAndScale} from '../../../core/utils';
import {DEPTHS} from "../../ui/depths";

export function playSpawnAnimation(scene, x, y, size) {
    const spawnEffect = scene.poolManager.spawn('spawnEffects', x, y);
    if (!spawnEffect) {
        return;
    }

    const {textureKey: animTexture, scale: animScale} = selectTextureAndScale(scene, 'black_hole_ss', size);
    const animKey = `spawn_anim_black_hole_${animTexture.split('@')[1]}`;

    spawnEffect
        .setDepth(DEPTHS.ENEMY - 0.1)
        .setScale(animScale)
        .play(animKey);

    spawnEffect.once('animationcomplete', () => {
        scene.poolManager.despawn('spawnEffects', spawnEffect);
    });
}

/**
 * Проигрывает анимацию взрыва в указанной точке.
 */
export function playExplosion(scene, x, y, size) {
    const explosion = scene.poolManager.spawn('explosions', x, y);
    if (!explosion) return;

    const {textureKey, scale} = selectTextureAndScale(scene, 'boom_ss1', size);
    const animKey = `explosion_anim_boom_ss1_${textureKey.split('@')[1]}`;

    explosion
        .setScale(scale)
        .setDepth(DEPTHS.EFFECTS_FOREGROUND)
        .play(animKey);

    explosion.once('animationcomplete', () => {
        scene.poolManager.despawn('explosions', explosion);
    });
}

/**
 * Проигрывает анимацию попадания пули в указанной точке.
 */
export function playHitEffect(scene, x, y) {
    const hitEffect = scene.poolManager.spawn('hitEffects', x, y, 'hit1');
    if (!hitEffect) return;

    hitEffect
        .setDepth(DEPTHS.EFFECTS_FOREGROUND)
        .setScale(1)
        .play('hit1_anim');

    hitEffect.once('animationcomplete', () => {
        scene.poolManager.despawn('hitEffects', hitEffect);
    });
}

/**
 * Проигрывает анимацию окрашивания (tint) на цели.
 */
export function playCritTween(scene, target) {

    scene.tweens.add({
        targets: target,
        tint: 0xff0000,
        duration: 100,
        yoyo: true,
        onComplete: () => {

            if (target && target.active) {
                target.clearTint();
            }
        }
    });

}

export function playDeathAnimation(scene, target, options = {}) {

    const clone = scene.poolManager.spawn('visualClones', target.x, target.y);
    if (!clone) return;

    clone.setTexture(target.texture.key, target.frame.name);
    clone.setScale(target.scale);
    clone.setRotation(target.rotation);
    clone.setAlpha(1);
    clone.setDepth(target.depth);

    const tweenConfig = {
        targets: clone,
        alpha: 0,
        duration: 300,
        ease: 'Power1',
        onComplete: () => {

            scene.poolManager.despawn('visualClones', clone);
        }
    };

    if (options.implode) {
        tweenConfig.scale = target.scale * 0.8;
    }

    scene.tweens.add(tweenConfig);
}