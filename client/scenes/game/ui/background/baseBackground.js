import Phaser from 'phaser';
import {BACKGROUND_COLOR_PALETTE} from './bgPalette.js';
import {DEPTHS} from "../depths";

export function createBaseBackground(scene) {

    const background = scene.add.rectangle(
        0,
        0,
        scene.startWidth,
        scene.startHeight,
        BACKGROUND_COLOR_PALETTE[0]
    )
        .setOrigin(0, 0)
        .setDepth(DEPTHS.BACKGROUND_SKY);

    return background;
}

/**
 * Запускает плавную анимацию смены цвета основного фона.
 * @param {Phaser.Scene} scene
 */
export function transitionBackgroundColor(scene) {
    if (!scene || !scene.backgroundLayers || !scene.backgroundLayers.base) {
        return;
    }

    const backgroundRect = scene.backgroundLayers.base;
    const currentColor = backgroundRect.fillColor;

    let nextColor;
    do {
        nextColor = Phaser.Utils.Array.GetRandom(BACKGROUND_COLOR_PALETTE);
    } while (nextColor === currentColor && BACKGROUND_COLOR_PALETTE.length > 1);

    console.log(`[Background] Transitioning color from 0x${currentColor.toString(16)} to 0x${nextColor.toString(16)}`);

    const fromColor = Phaser.Display.Color.ValueToColor(currentColor);
    const toColor = Phaser.Display.Color.ValueToColor(nextColor);

    scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 4000,
        ease: 'Sine.easeInOut',
        onUpdate: tween => {
            const value = tween.getValue();
            const interpolatedColor = Phaser.Display.Color.Interpolate.ColorWithColor(fromColor, toColor, 100, value);

            backgroundRect.fillColor = Phaser.Display.Color.GetColor(interpolatedColor.r, interpolatedColor.g, interpolatedColor.b);
        }
    });
}
