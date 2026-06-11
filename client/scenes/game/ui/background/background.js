import {createBaseBackground, transitionBackgroundColor} from './baseBackground';
import {createStarsBackground, updateStarsBackground} from './stars';
import {createCloudsBackground} from './clouds';
import {createPlanetsBackground, updatePlanetsBackground, transitionPlanets} from './planets';
import {createStonesBackground, updateStonesBackground} from './stones';
import {createHangar} from './hangar';
import {createShield} from './shield';
import {DEPTHS} from "../depths";

/**
 * Плавно затемняет фон для выделения UI элементов.
 * @param {Phaser.Scene} scene
 */
export function dimBackground(scene) {
    const overlay = scene.backgroundLayers?.dimOverlay;
    if (!overlay) return;

    scene.tweens.killTweensOf(overlay);

    scene.tweens.add({
        targets: overlay,
        alpha: 0.7,
        duration: 1000,
        ease: 'Sine.easeInOut'
    });
}

/**
 * Плавно убирает затемнение фона.
 * @param {Phaser.Scene} scene
 */
export function undimBackground(scene) {
    const overlay = scene.backgroundLayers?.dimOverlay;
    if (!overlay) return;

    scene.tweens.killTweensOf(overlay);

    scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 500,
        ease: 'Sine.easeInOut'
    });
}

/**
 * Создает все слои фона для игровой сцены.
 * @param {Phaser.Scene} scene
 * @returns {object} - Объект, содержащий ссылки на все слои фона.
 */
export function createBackground(scene) {
    scene.cameras.main.setViewport(0, 0, scene.startWidth, scene.startHeight);
    scene.cameras.main.setBounds(0, 0, scene.startWidth, scene.startHeight);
    scene.cameras.main.setZoom(1);

    const baseBackground = createBaseBackground(scene);
    baseBackground.setDepth(DEPTHS.BACKGROUND_SKY);

    const dimOverlay = scene.add.rectangle(
        0, 0,
        scene.startWidth, scene.startHeight,
        0x000000
    )
        .setOrigin(0, 0)
        .setDepth(DEPTHS.BACKGROUND_OVERLAY)
        .setAlpha(0);

    const cloudsBackground = createCloudsBackground(scene);

    const starsBackground = createStarsBackground(scene);
    starsBackground.dustEmitter.setDepth(DEPTHS.BACKGROUND_STARS);
    starsBackground.brightEmitter.setDepth(DEPTHS.BACKGROUND_STARS + 0.1);
    starsBackground.pulsarEmitter.setDepth(DEPTHS.BACKGROUND_STARS + 0.2);

    const stonesBackground = createStonesBackground(scene);
    stonesBackground.stoneLayers.forEach((layer, i) => {
        layer.setDepth(DEPTHS.BACKGROUND_STONES - (i * 0.01));
    });

    const planetsBackground = createPlanetsBackground(scene);
    planetsBackground.planetLayers.forEach((layer, i) => {
        layer.setDepth(DEPTHS.BACKGROUND_PLANETS - (i * 0.01));
    });

    const {hangarLayer, hangarHeight, hangarScale, hangarX, hangarY} = createHangar(scene);
    hangarLayer.setDepth(DEPTHS.BASE);

    const shieldLayer = createShield(scene, hangarHeight, hangarScale, hangarX, hangarY);
    shieldLayer.setDepth(DEPTHS.BASE_SHIELD);

    scene.backgroundLayers = {
        base: baseBackground,
        dimOverlay: dimOverlay,
        clouds: cloudsBackground,
        dynamic: starsBackground,
        stones: stonesBackground,
        planets: planetsBackground,
        hangar: {
            layer: hangarLayer,
            shield: shieldLayer
        }
    };

    const stageClearedListener = () => {
        transitionPlanets(scene);
        transitionBackgroundColor(scene);
    };
    scene.events.on('stageCleared', stageClearedListener);

    scene.events.on('shutdown', () => {
        scene.events.off('stageCleared', stageClearedListener);
        console.log('GameScene: Background event listeners removed.');
    }, scene);

    return scene.backgroundLayers;
}

/**
 * Обновляет динамические элементы фона (параллакс).
 * @param {Phaser.Scene} scene
 * @param {number} delta - Время с прошлого кадра в миллисекундах.
 */
export function updateBackground(scene, delta) {
    updateStarsBackground(scene, delta);
    updatePlanetsBackground(scene, delta);
    updateStonesBackground(scene, delta);
}