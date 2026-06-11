import {selectSpritesheetTextureAndScale} from '../../../core/utils.js';
import {DEPTHS} from "../depths";

export function createStonesBackground(scene) {

    const stoneTextureKeys = ['stones1', 'stones2', 'stones3', 'stones4', 'stones5', 'stones6'];

    const selectedTextureKey = Phaser.Utils.Array.GetRandom(stoneTextureKeys);

    const stoneLayers = [];

    const numStaticStones = Phaser.Math.Between(0, 0);
    const numDynamicStones = Phaser.Math.Between(5, 10);
    const numStones = numStaticStones + numDynamicStones;

    const usedFrameIndices = [];

    const checkOverlap = (newX, newY, newScaledWidth, newScaledHeight, existingStones) => {
        const minDistance = Math.max(newScaledWidth, newScaledHeight) * 1.5;
        for (const stone of existingStones) {
            const dx = newX - stone.x;
            const dy = newY - stone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) return true;
        }
        return false;
    };

    const isInForbiddenZone = (x, y, scene) => {
        const forbiddenXMin = -100;
        const forbiddenXMax = 100;
        const forbiddenYMin = scene.startHeight / 2 - 100;
        const forbiddenYMax = scene.startHeight / 2 + 100;
        return x >= forbiddenXMin && x <= forbiddenXMax && y >= forbiddenYMin && y <= forbiddenYMax;
    };

    for (let i = 0; i < numStones; i++) {

        const referenceWidth = 800;
        const baseScaleFactor = 0.6;
        const scaleVariation = Phaser.Math.FloatBetween(0.5, 1.5);
        const scaleFactor = baseScaleFactor * scaleVariation * (scene.startWidth / referenceWidth);
        const targetWidth = 256 * scaleFactor;

        const {textureKey, scale} = selectSpritesheetTextureAndScale(scene, selectedTextureKey, targetWidth);

        const textureData = scene.textures.get(textureKey);
        const frameCount = Object.keys(textureData.frames).length - (textureData.frames['__BASE'] ? 1 : 0) || 2;
        let frameIndex;
        if (usedFrameIndices.length >= frameCount) {
            usedFrameIndices.length = 0;
        }
        do {
            frameIndex = Phaser.Math.Between(0, frameCount - 1);
        } while (usedFrameIndices.includes(frameIndex));
        usedFrameIndices.push(frameIndex);

        const scaledWidth = 256 * scale;
        const scaledHeight = 256 * scale;

        const overlap = 0.1;
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;

        const zoneCount = 4;
        const zoneWidth = (scene.startWidth - scaledWidth * 2 * overlap) / zoneCount;

        do {
            const zoneIndex = Math.floor(Math.random() * zoneCount);
            const xMin = scaledWidth * overlap + zoneIndex * zoneWidth;
            const xMax = Math.min(xMin + zoneWidth, scene.startWidth - scaledWidth * overlap);
            x = Phaser.Math.FloatBetween(xMin, xMax);
            y = Phaser.Math.FloatBetween(scaledHeight * overlap, scene.startHeight - scaledHeight * overlap);
            attempts++;
        } while (
            (checkOverlap(x, y, scaledWidth, scaledHeight, stoneLayers) || isInForbiddenZone(x, y, scene)) &&
            attempts < maxAttempts
            );

        if (attempts >= maxAttempts) {
            console.warn(`Could not place stone ${i + 1}/${numStones} without overlap or in forbidden zone after ${maxAttempts} attempts`);
            usedFrameIndices.pop();
            continue;
        }

        const depth = DEPTHS.BACKGROUND_STONES - (i * 0.01);
        const rotation = Phaser.Math.Between(-45, 45);

        const stoneLayer = scene.add.sprite(x, y, textureKey, frameIndex)
            .setOrigin(0.5, 0.5)
            .setDepth(depth)
            .setScale(scale)
            .setAlpha(1)
            .setRotation(Phaser.Math.DegToRad(rotation));

        stoneLayer.originalScale = scale;
        if (i < numStaticStones) {

            stoneLayer.parallaxVariation = Phaser.Math.FloatBetween(0.5, 1.5);
            stoneLayer.scaleVariation = Phaser.Math.FloatBetween(0.5, 1.5);

            stoneLayer.directionX = Math.random() < 0.5 ? 1 : -1;
            stoneLayer.directionY = Math.random() < 0.5 ? 1 : -1;
        }

        if (i >= numStaticStones) {

            stoneLayer.velocityX = Phaser.Math.Between(5, 15) * (Math.random() < 0.5 ? 1 : -1);
            stoneLayer.velocityY = Phaser.Math.Between(5, 15) * (Math.random() < 0.5 ? 1 : -1);

            stoneLayer.angularVelocity = Phaser.Math.FloatBetween(0.1, 0.3) * (Math.random() < 0.5 ? 1 : -1);
        }

        stoneLayers.push(stoneLayer);

    }

    const stonesBackground = {
        stoneLayers,
        stonesOffset: 0,
        stonesSpeed: 0,
        numStaticStones
    };

    return stonesBackground;
}

export function updateStonesBackground(scene, delta) {
    if (!scene.playerShip?.sprite?.body) {
        return;
    }

    const deltaSec = delta / 1000;
    const velocityX = scene.playerShip.sprite.body.velocity.x;
    const velocityY = scene.playerShip.sprite.body.velocity.y;

    const parallaxFactor = 0.012;
    const scaleFactor = 0.00002;
    const maxScaleChange = 0.012;

    scene.backgroundLayers.stones.stoneLayers.forEach((stone, index) => {

        if (index < scene.backgroundLayers.stones.numStaticStones) {

            const stoneParallaxFactor = parallaxFactor * stone.parallaxVariation;
            const stoneScaleFactor = scaleFactor * stone.scaleVariation;

            const offsetX = velocityX * stoneParallaxFactor * deltaSec * stone.directionX;
            const offsetY = velocityY * stoneParallaxFactor * deltaSec * stone.directionY;
            stone.x += offsetX;
            stone.y += offsetY;

            let scaleChange = 0;
            if (velocityX > 0) {
                scaleChange -= stoneScaleFactor * velocityX * deltaSec;
            } else if (velocityX < 0) {
                scaleChange += stoneScaleFactor * -velocityX * deltaSec;
            }
            if (velocityY > 0) {
                scaleChange += stoneScaleFactor * velocityY * deltaSec;
            } else if (velocityY < 0) {
                scaleChange -= stoneScaleFactor * -velocityY * deltaSec;
            }

            let newScale = stone.scaleX + scaleChange;
            const minScale = stone.originalScale * (1 - maxScaleChange);
            const maxScale = stone.originalScale * (1 + maxScaleChange);
            newScale = Math.max(minScale, Math.min(newScale, maxScale));
            stone.setScale(newScale);
        }

        if (stone.velocityX || stone.velocityY) {

            stone.x += stone.velocityX * deltaSec;
            stone.y += stone.velocityY * deltaSec;

            stone.angle += stone.angularVelocity * deltaSec * (180 / Math.PI);

            const scaledWidth = stone.displayWidth;
            const scaledHeight = stone.displayHeight;
            const minX = scaledWidth / 2;
            const maxX = scene.startWidth - scaledWidth / 2;
            const minY = scaledHeight / 2;
            const maxY = scene.startHeight - scaledHeight / 2;

            if (stone.x < minX || stone.x > maxX) {
                stone.velocityX = -stone.velocityX;
                stone.x = Phaser.Math.Clamp(stone.x, minX, maxX);
            }

            if (stone.y < minY || stone.y > maxY) {
                stone.velocityY = -stone.velocityY;
                stone.y = Phaser.Math.Clamp(stone.y, minY, maxY);
            }
        }
    });
}