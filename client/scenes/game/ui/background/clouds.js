import {DEPTHS} from "../depths";

export function createCloudsBackground(scene) {
    const cloudTextures = ['cloud1', 'cloud2', 'cloud3', 'cloud4', 'cloud5', 'cloud6', 'cloud7', 'cloud8'];
    const tintColors = [0x00FFFF, 0x9252D8, 0xF24BF7, 0x3ed8b8];
    const cloudLayers = [];
    const baseScaleFactor = 0.3;
    const resolutionScale = Math.max(scene.startWidth / 800, scene.startHeight / 600);
    const numStaticTextures = Phaser.Math.Between(10, 10);
    const numDynamicTextures = 2;

    const cloudPool = scene.add.group({
        maxSize: numDynamicTextures,
        createCallback: (cloud) => {
            cloud.setOrigin(0.5, 0.5).setActive(false).setVisible(false);
        }
    });

    for (let i = 0; i < numDynamicTextures; i++) {
        cloudPool.create(0, 0, cloudTextures[0]);
    }

    const createCloud = (i, isDynamic, isFar) => {
        const texture = cloudTextures[Math.floor(Math.random() * cloudTextures.length)];
        const textureData = scene.textures.get(texture);
        const textureWidth = textureData.source[0].width;
        const textureHeight = textureData.source[0].height;
        const scaleModifier = isFar ? 0.2 : 0.8;
        const scale = baseScaleFactor * resolutionScale * Math.max(scene.startWidth / textureWidth, scene.startHeight / textureHeight) * scaleModifier;
        const scaledWidth = textureWidth * scale;
        const scaledHeight = textureHeight * scale;
        const overlap = Phaser.Math.FloatBetween(0.1, 0.3);
        const x = Phaser.Math.Between(-scaledWidth * overlap, scene.startWidth + scaledWidth * overlap);
        const y = Phaser.Math.Between(-scaledHeight * overlap, scene.startHeight + scaledHeight * overlap);
        const rotation = Phaser.Math.Between(-45, 45);
        const alpha = isFar ? 0.15 : 0.15;
        const depth = DEPTHS.BACKGROUND_CLOUDS - (i * 0.01);
        const tint = tintColors[Math.floor(Math.random() * tintColors.length)];

        const cloudLayer = isDynamic
            ? cloudPool.get(x, y).setTexture(texture).setActive(true).setVisible(true)
            : scene.add.image(x, y, texture);

        cloudLayer
            .setOrigin(0.5, 0.5)
            .setDepth(depth)
            .setScale(scale)
            .setAlpha(alpha)
            .setRotation(Phaser.Math.DegToRad(rotation))
            .setTint(tint);

        scene.tweens.add({
            targets: cloudLayer,
            rotation: Phaser.Math.DegToRad(rotation + Phaser.Math.Between(-10, 10)),
            duration: 20000 + Math.random() * 10000,
            yoyo: true,
            repeat: -1
        });

        return {cloudLayer, overlap, scale, depth, alpha, scaledWidth, scaledHeight, isFar};
    };

    for (let i = 0; i < numStaticTextures; i++) {
        const isFar = i >= numStaticTextures / 2;
        const {cloudLayer} = createCloud(i, false, isFar);
        cloudLayers.push(cloudLayer);
    }

    const dynamicClouds = [];
    for (let i = 0; i < numDynamicTextures; i++) {
        const isFar = i >= numDynamicTextures / 2;
        const cloudData = createCloud(i + numStaticTextures, true, isFar);
        cloudLayers.push(cloudData.cloudLayer);
        dynamicClouds.push({index: cloudLayers.length - 1, ...cloudData});
    }

    let swapTimer = null;

    const swapRandomClouds = () => {

        if (!scene || !scene.scene || !scene.scene.isActive()) {
            if (swapTimer) {
                swapTimer.remove();
                swapTimer = null;
            }
            return;
        }

        const numToSwap = Phaser.Math.Between(1, Math.min(3, dynamicClouds.length));
        const cloudsToSwap = Phaser.Utils.Array.Shuffle(dynamicClouds).slice(0, numToSwap);

        cloudsToSwap.forEach(({index, scale, depth, alpha, scaledWidth, scaledHeight, isFar}, swapIndex) => {
            const oldCloud = cloudLayers[index];

            scene.tweens.add({
                targets: oldCloud,
                alpha: 0,
                duration: 10000,
                ease: 'Sine.InOut',
                onComplete: () => {
                    oldCloud.setActive(false).setVisible(false);

                    const newOverlap = Phaser.Math.FloatBetween(0.1, 0.3);
                    const newX = Phaser.Math.Between(-scaledWidth * newOverlap, scene.startWidth + scaledWidth * newOverlap);
                    const newY = Phaser.Math.Between(-scaledHeight * newOverlap, scene.startHeight + scaledHeight * newOverlap);
                    const newTexture = cloudTextures[Math.floor(Math.random() * cloudTextures.length)];
                    const newRotation = Phaser.Math.Between(-45, 45);
                    const newTint = tintColors[Math.floor(Math.random() * tintColors.length)];

                    const newCloud = cloudPool.get(newX, newY);
                    if (!newCloud) {
                        return;
                    }

                    newCloud
                        .setTexture(newTexture)
                        .setActive(true)
                        .setVisible(true)
                        .setOrigin(0.5, 0.5)
                        .setDepth(depth)
                        .setScale(scale)
                        .setAlpha(0)
                        .setRotation(Phaser.Math.DegToRad(newRotation))
                        .setTint(newTint);

                    scene.tweens.add({
                        targets: newCloud,
                        alpha: alpha,
                        duration: 10000,
                        ease: 'Sine.InOut',
                        onComplete: () => {
                            cloudLayers[index] = newCloud;
                            dynamicClouds[dynamicClouds.findIndex(c => c.index === index)] = {
                                index,
                                cloudLayer: newCloud,
                                overlap: newOverlap,
                                scale,
                                depth,
                                alpha,
                                scaledWidth,
                                scaledHeight,
                                isFar
                            };
                        }
                    });

                    scene.tweens.add({
                        targets: newCloud,
                        rotation: Phaser.Math.DegToRad(newRotation + Phaser.Math.Between(-10, 10)),
                        duration: 20000 + Math.random() * 10000,
                        yoyo: true,
                        repeat: -1
                    });
                }
            });
        });

        swapTimer = scene.time.delayedCall(Phaser.Math.Between(10000, 20000), swapRandomClouds);
    };

    swapTimer = scene.time.delayedCall(Phaser.Math.Between(10000, 20000), swapRandomClouds);

    scene.events.on('shutdown', () => {
        if (swapTimer) {
            swapTimer.remove();
            swapTimer = null;
            console.log('GameScene: Cloud swap timer removed.');
        }
    });

    const cloudsBackground = {
        cloudLayers,
        cloudsOffset: 0,
        cloudsSpeed: 0,
        dynamicClouds,
        cloudPool,
        swapTimer: swapTimer
    };

    return cloudsBackground;

}