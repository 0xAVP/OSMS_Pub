import Phaser from 'phaser';
import {selectSpritesheetTextureAndScale} from '../../../core/utils.js';
import {DEPTHS} from "../depths";

/**
 * Создает и размещает новый набор планет на сцене.
 * Эта функция вынесена отдельно, чтобы ее можно было вызывать как при старте, так и во время смены фона.
 * @param {Phaser.Scene} scene
 * @returns {Phaser.GameObjects.Sprite[]} - Массив созданных спрайтов планет.
 */
export function createAndPlacePlanets(scene) {

    const planetSpritesheetKeys = ['planets1', 'planets2'];
    const usedFrameIndices = Object.fromEntries(planetSpritesheetKeys.map(key => [key, []]));

    const textureCache = new Map();
    planetSpritesheetKeys.forEach(key => {
        const baseTexture = `${key}@1x`;
        if (scene.textures.exists(baseTexture)) {
            const textureData = scene.textures.get(baseTexture);
            const frameCount = Object.keys(textureData.frames).length - (textureData.frames['__BASE'] ? 1 : 0);
            textureCache.set(key, {frameCount: frameCount || 1});
        } else {
            console.warn(`Texture ${baseTexture} not found, defaulting to single frame`);
            textureCache.set(key, {frameCount: 1});
        }
    });

    const numPlanets = Math.random() < 0.1 ? 3 : Math.random() < 0.3 ? 2 : 1;
    const newPlanetLayers = [];

    const checkOverlap = (x, y, scaledWidth, scaledHeight, planets) => {
        const minDistance = Math.max(scaledWidth, scaledHeight) * 1.5;
        return planets.some(planet => {
            const dx = x - planet.x;
            const dy = y - planet.y;
            return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });
    };

    const isInForbiddenZone = (x, y, {startHeight}) => {
        const centerY = startHeight / 2;
        return x >= -100 && x <= 100 && y >= centerY - 100 && y <= centerY + 100;
    };

    for (let i = 0; i < numPlanets; i++) {
        const planetSpritesheetKey = planetSpritesheetKeys[Math.floor(Math.random() * planetSpritesheetKeys.length)];
        const {frameCount} = textureCache.get(planetSpritesheetKey);

        if (usedFrameIndices[planetSpritesheetKey].length >= frameCount) {
            console.warn(`No unique frames left for planet ${i + 1} in ${planetSpritesheetKey}`);
            continue;
        }

        const targetWidth = scene.startWidth / 5 * (i === 0 ? 1 : i === 1 ? 0.5 : 0.3);
        const {textureKey, scale} = selectSpritesheetTextureAndScale(scene, planetSpritesheetKey, targetWidth, false);
        const textureData = scene.textures.get(textureKey);
        const frameWidth = textureData.frames[0]?.width || 512;
        const frameHeight = textureData.frames[0]?.height || 512;

        let frameIndex;
        do {
            frameIndex = Phaser.Math.Between(0, frameCount - 1);
        } while (usedFrameIndices[planetSpritesheetKey].includes(frameIndex));
        usedFrameIndices[planetSpritesheetKey].push(frameIndex);

        const scaledWidth = frameWidth * scale;
        const scaledHeight = frameHeight * scale;

        const overlap = 0.1;
        const zoneCount = 4;
        const zoneWidth = (scene.startWidth - scaledWidth * 2 * overlap) / zoneCount;
        let x, y, attempts = 0;
        const maxAttempts = 10;

        do {
            const zoneIndex = Math.floor(Math.random() * zoneCount);
            const xMin = i === 0 ? scaledWidth * overlap + zoneIndex * zoneWidth : scene.startWidth * 0.01 + scaledWidth / 2 + zoneIndex * zoneWidth;
            const xMax = Math.min(xMin + zoneWidth, scene.startWidth - (i === 0 ? scaledWidth * overlap : scaledWidth / 2 + scene.startWidth * 0.01));
            x = Phaser.Math.FloatBetween(xMin, xMax);
            y = Phaser.Math.FloatBetween(
                i === 0 ? scaledHeight * overlap : scene.startHeight * 0.01 + scaledHeight / 2,
                i === 0 ? scene.startHeight - scaledHeight * overlap : scene.startHeight - scaledHeight / 2 - scene.startHeight * 0.01
            );
            attempts++;
        } while (
            (checkOverlap(x, y, scaledWidth, scaledHeight, newPlanetLayers) || isInForbiddenZone(x, y, scene)) &&
            attempts < maxAttempts
            );

        if (attempts >= maxAttempts) {
            console.warn(`Could not place planet ${i + 1} after ${maxAttempts} attempts`);
            usedFrameIndices[planetSpritesheetKey].pop();
            continue;
        }

        const depth = DEPTHS.BACKGROUND_PLANETS - (i * 0.01);
        const rotation = Phaser.Math.Between(-45, 45);
        const planet = scene.add.sprite(x, y, textureKey, frameIndex)
            .setOrigin(0.5)
            .setDepth(depth)
            .setScale(scale)
            .setAlpha(1)
            .setRotation(Phaser.Math.DegToRad(rotation));

        planet.originalScale = scale;
        planet.setData('targetX', x);
        planet.setData('targetY', y);

        newPlanetLayers.push(planet);
    }

    return newPlanetLayers;
}

/**
 * Запускает анимацию смены планет.
 * @param {Phaser.Scene} scene
 */
export function transitionPlanets(scene) {
    if (!scene || !scene.backgroundLayers || !scene.backgroundLayers.planets) {
        return;
    }
    console.log('[Background] Starting planet transition...');

    const oldPlanets = scene.backgroundLayers.planets.planetLayers;
    const transitionDuration = 4000;

    oldPlanets.forEach((planet, index) => {
        scene.tweens.add({
            targets: planet,
            x: -planet.displayWidth,
            alpha: 0,
            duration: transitionDuration,
            ease: 'Sine.easeIn',
            delay: index * 200,
            onComplete: () => {
                if (planet && planet.scene) {
                    planet.destroy();
                }
            }
        });
    });

    const newPlanets = createAndPlacePlanets(scene);

    newPlanets.forEach((planet, index) => {
        const targetX = planet.getData('targetX');
        const targetY = planet.getData('targetY');

        planet.x = scene.startWidth + planet.displayWidth;
        planet.setAlpha(0);

        scene.tweens.add({
            targets: planet,
            x: targetX,
            y: targetY,
            alpha: 1,
            duration: transitionDuration,
            ease: 'Sine.easeOut',
            delay: 1000 + index * 300,
        });
    });

    scene.backgroundLayers.planets.planetLayers = newPlanets;
}

export function createPlanetsBackground(scene) {
    const planetLayers = createAndPlacePlanets(scene);

    const planetsBackground = {
        planetLayers,
        planetsOffset: 0,
        planetsSpeed: 0
    };

    return planetsBackground;
}

export function updatePlanetsBackground(scene, delta) {
    if (!scene.playerShip?.sprite?.body) {
        return;
    }

    const velocityX = scene.playerShip.sprite.body.velocity.x;
    const velocityY = scene.playerShip.sprite.body.velocity.y;
    const deltaSec = delta / 1000;
    const parallaxFactor = 0.01;
    const scaleFactor = 0.00002;
    const maxScaleChange = 0.01;

    scene.backgroundLayers.planets.planetLayers.forEach(planet => {
        planet.x -= velocityX * parallaxFactor * deltaSec;
        planet.y -= velocityY * parallaxFactor * deltaSec;

        let scaleChange = 0;
        if (velocityX > 0) scaleChange -= scaleFactor * velocityX * deltaSec;
        else if (velocityX < 0) scaleChange += scaleFactor * -velocityX * deltaSec;
        if (velocityY > 0) scaleChange += scaleFactor * velocityY * deltaSec;
        else if (velocityY < 0) scaleChange -= scaleFactor * -velocityY * deltaSec;

        const baseScale = planet.originalScale ?? planet.scaleX;

        const newScale = Math.max(
            baseScale * (1 - maxScaleChange),
            Math.min(baseScale * (1 + maxScaleChange), planet.scaleX + scaleChange)
        );
        planet.setScale(newScale);
    });
}