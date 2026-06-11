import {selectTextureAndScale} from '../../../core/utils.js';
import {DEPTHS} from "../depths";

export function createShield(scene) {
    const shieldTextureBaseKey = 'base_shield';
    const baseTextureKey = `${shieldTextureBaseKey}@1x`;

    if (!scene.textures.exists(baseTextureKey)) {
        console.error(`Shield texture ${baseTextureKey} not found!`);
        return null;
    }

    const hangarHeight = (1.2 / 3) * scene.startHeight;
    const maxScreenHeight = hangarHeight * 1.3;

    const baseTexture = scene.textures.get(baseTextureKey);
    const baseTextureHeight = baseTexture.source[0].height;

    let selectedTextureKey, finalScale;
    try {
        const result = selectTextureAndScale(
            scene,
            shieldTextureBaseKey,
            maxScreenHeight,
            true
        );
        selectedTextureKey = result.textureKey;
        finalScale = result.scale;
    } catch (error) {
        console.error(`Error selecting texture for ${shieldTextureBaseKey}: ${error.message}`);
        return null;
    }

    const selectedTexture = scene.textures.get(selectedTextureKey);
    const selectedTextureHeight = selectedTexture.source[0].height;
    const actualHeight = selectedTextureHeight * finalScale;
    if (actualHeight > maxScreenHeight) {
        finalScale = maxScreenHeight / selectedTextureHeight;
        console.warn(`Shield scale adjusted to ${finalScale.toFixed(4)} to fit maxScreenHeight=${maxScreenHeight.toFixed(1)}`);
    }

    const x = 0;
    const y = scene.startHeight / 2;

    const shieldLayer = scene.add.image(x, y, selectedTextureKey)
        .setOrigin(0.0, 0.5)
        .setDepth(DEPTHS.BASE_SHIELD)
        .setScale(finalScale)
        .setAlpha(0.3)
        .setVisible(true);

    let lastFlashTime = 0;
    const flashCooldown = 200;
    const flashShield = () => {
        const now = Date.now();
        if (now - lastFlashTime < flashCooldown) return;
        lastFlashTime = now;
        if (!shieldLayer.visible) shieldLayer.setVisible(true);
        scene.tweens.add({
            targets: shieldLayer,
            alpha: {from: 0.3, to: 0.8},
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => shieldLayer.setAlpha(0.3)
        });
    };

    const baseDamagedHandler = (enemyId) => {
        flashShield();
    };
    scene.events.on('baseDamaged', baseDamagedHandler);

    scene.events.on('shutdown', () => {
        scene.events.off('baseDamaged', baseDamagedHandler);
        console.log('GameScene: Base damaged listener removed.');
    });

    return shieldLayer;
}