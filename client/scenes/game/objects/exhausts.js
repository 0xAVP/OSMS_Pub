export const EXHAUSTS = [
    {
        key: 1,
        type: 'animation',
        texture: 'exhaust3',
        animKey: 'exhaust3_anim',
        frameRate: 16,
        frameWidth: 64,
        frameHeight: 64,
        scaleFactor: 0.5,
        alpha: 0.8,
        frameCount: 16,
        flipX: true
    },
    {
        key: 2,
        type: 'animation',
        texture: 'exhaust4',
        animKey: 'exhaust4_anim',
        frameRate: 16,
        frameWidth: 64,
        frameHeight: 64,
        scaleFactor: 0.5,
        alpha: 0.8,
        frameCount: 16
    }
];

export function initExhaustTextures(scene) {

    const textureKeys = ['exhaust3', 'exhaust4'];
    textureKeys.forEach(key => {
        if (!scene.textures.exists(key)) {
            console.warn(`Texture ${key} not found, generating placeholder`);
            const graphics = scene.add.graphics();
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(16, 16, 16);
            graphics.generateTexture(key, 32, 32);
            graphics.destroy();
            console.log(`Generated placeholder texture for ${key}`);
        }
    });
}

export function initExhaustAnimations(scene) {
    EXHAUSTS.forEach(exhaust => {

        if (exhaust.type === 'animation') {
            if (!scene.textures.exists(exhaust.texture)) {
                console.error(`Texture ${exhaust.texture} not found for animation ${exhaust.animKey}`);
                return;
            }
            if (!scene.anims.exists(exhaust.animKey)) {
                scene.anims.create({
                    key: exhaust.animKey,
                    frames: scene.anims.generateFrameNumbers(exhaust.texture, {
                        start: 0,
                        end: exhaust.frameCount - 1
                    }),
                    frameRate: exhaust.frameRate,
                    repeat: -1
                });
                console.log(`Animation ${exhaust.animKey} created for ${exhaust.key} with ${exhaust.frameCount} frames`);
            }
        }
    });
}

export function createExhaust(scene, follow, exhaustTypeKey, isEnemy = false) {
    if (!exhaustTypeKey) {
        return null;
    }

    const exhaustType = EXHAUSTS.find(ex => ex.key === exhaustTypeKey);
    if (!exhaustType) {
        console.warn(`Exhaust type "${exhaustTypeKey}" (type: ${typeof exhaustTypeKey}) not found in EXHAUSTS config.`);
        return null;
    }

    if (!scene.textures.exists(exhaustType.texture)) {
        console.error(`Texture ${exhaustType.texture} does not exist!`);
        return null;
    }

    if (!follow || typeof follow.x !== 'number' || typeof follow.y !== 'number') {
        console.error(`Invalid follow object:`, follow);
        return null;
    }

    const exhaustSprite = scene.poolManager.spawn('exhausts', 0, 0, exhaustType.texture);
    if (!exhaustSprite) {
        console.warn("Exhausts pool is full!");
        return null;
    }

    const offsetX = isEnemy ? follow.displayWidth / 2 : -(follow.displayWidth / 2);

    exhaustSprite
        .setPosition(follow.x + offsetX, follow.y)
        .setDepth(follow.depth - 0.01)
        .setOrigin(isEnemy ? 0 : 1, 0.5)
        .setActive(true)
        .setVisible(true);

    if (exhaustType.flipX) {
        exhaustSprite.setFlipX(true);
    }

    const referenceHeight = exhaustType.frameHeight || 32;
    const shipHeight = isEnemy ? (follow.getData('enemySize').height) : (scene.shipConfig.shipSize.height);
    const exhaustScale = (shipHeight / referenceHeight) * exhaustType.scaleFactor;
    exhaustSprite.setScale(exhaustScale);

    if (exhaustType.alpha !== undefined) {
        exhaustSprite.setAlpha(exhaustType.alpha);
    }

    if (scene.anims.exists(exhaustType.animKey)) {
        exhaustSprite.play(exhaustType.animKey);
    } else {
        console.warn(`Animation ${exhaustType.animKey} not found for exhaust ${exhaustType.key}`);
    }

    return exhaustSprite;
}
