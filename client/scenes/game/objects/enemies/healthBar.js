import Phaser from 'phaser';
import {DEPTHS} from "../../ui/depths";

/**
 * Создает текстуру 'nine_slice_bar' один раз за сессию.
 * Эту функцию нужно вызвать в create() главной сцены до инициализации пулов.
 * @param {Phaser.Scene} scene
 */
export function initHealthBarTexture(scene) {

    if (scene.textures.exists('nine_slice_bar')) {
        return;
    }

    const cornerRadius = 5;
    const width = 12;
    const height = 12;
    const nineSliceGraphics = scene.make.graphics();
    nineSliceGraphics.fillStyle(0xffffff);
    nineSliceGraphics.fillRoundedRect(0, 0, width, height, cornerRadius);
    nineSliceGraphics.generateTexture('nine_slice_bar', width, height);
    nineSliceGraphics.destroy();
    console.log('Texture "nine_slice_bar" created for health bars.');
}

export function createHealthBar(scene, x, y, width, height) {
    const textureKey = 'nine_slice_bar';
    const cornerCutSize = 6;
    const bg = scene.add.nineslice(0, 0, textureKey, 0, width, height, cornerCutSize, cornerCutSize, cornerCutSize, cornerCutSize).setOrigin(0, 0.5).setTint(0x000000).setAlpha(0.6);
    const fill = scene.add.nineslice(0, 0, textureKey, 0, width, height, cornerCutSize, cornerCutSize, cornerCutSize, cornerCutSize).setOrigin(0, 0.5);
    fill.fullWidth = width;
    const container = scene.add.container(x, y, [bg, fill]);
    container.setDepth(DEPTHS.ENEMY_UI);
    const update = (currentValue, maxValue) => {
        if (maxValue <= 0) return;
        const percentage = Phaser.Math.Clamp(currentValue / maxValue, 0, 1);
        fill.width = fill.fullWidth * percentage;
        if (percentage > 0.5) fill.setTint(0x03BE61);
        else if (percentage > 0.25) fill.setTint(0xFEBA00);
        else fill.setTint(0xE663CB);
    };
    const resize = (newWidth) => {
        bg.width = newWidth;
        fill.fullWidth = newWidth;
    };
    return {container, update, resize};
}
