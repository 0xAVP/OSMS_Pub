import {DEPTHS} from './depths';
import Phaser from 'phaser';

export function createStyledHudBar(scene, x, y, label, color) {
    const scaleFactor = Math.min(scene.startWidth / 1920, scene.startHeight / 1080);
    const scale = (value) => value * scaleFactor;

    const BAR_WIDTH = scale(220);
    const BAR_HEIGHT = scale(35);
    const CORNER_CUT = scale(15);
    const PADDING = scale(4);

    const BG_COLOR = 0x0A0A1A;
    const BG_ALPHA = 0.8;

    const container = scene.add.container(x, y).setDepth(DEPTHS.UI_HUD).setAlpha(0.8);

    const background = scene.add.graphics();
    const bgPoints = [
        {x: 0, y: 0}, {x: BAR_WIDTH - CORNER_CUT, y: 0},
        {x: BAR_WIDTH, y: CORNER_CUT}, {x: BAR_WIDTH, y: BAR_HEIGHT},
        {x: CORNER_CUT, y: BAR_HEIGHT}, {x: 0, y: BAR_HEIGHT - CORNER_CUT}
    ];
    background.fillStyle(BG_COLOR, BG_ALPHA);
    background.fillPoints(bgPoints, true);
    background.lineStyle(2, 0x41C6FF, 0.5);
    background.strokePoints(bgPoints, true);
    container.add(background);

    const fill = scene.add.graphics();
    container.add(fill);

    const labelText = scene.add.text(scale(20), BAR_HEIGHT / 2, label, {
        fontFamily: 'Tektur',
        fontSize: `${scale(14)}px`,
        color: '#ffffff',
        fontStyle: '600'
    }).setOrigin(0, 0.5);
    container.add(labelText);

    const valueText = scene.add.text(BAR_WIDTH - scale(15), BAR_HEIGHT / 2, '0/0', {
        fontFamily: 'Orbitron',
        fontSize: `${scale(14)}px`,
        color: '#ffffff',
        fontStyle: '600'
    }).setOrigin(1, 0.5);
    container.add(valueText);

    let maxValue = 100;

    const update = (currentValue, newMaxValue) => {
        if (newMaxValue !== undefined && Number.isFinite(newMaxValue)) {
            maxValue = newMaxValue > 0 ? newMaxValue : 1;
        }

        if (maxValue === 0) return;

        const percentage = Phaser.Math.Clamp(currentValue / maxValue, 0, 1);
        valueText.setText(`${Math.round(currentValue)} / ${Math.round(maxValue)}`);

        const currentFillWidth = BAR_WIDTH * percentage;

        fill.clear();

        fill.fillStyle(color, 1);
        const fillPoints = [
            {x: PADDING, y: PADDING}, {x: BAR_WIDTH - CORNER_CUT - PADDING, y: PADDING},
            {x: BAR_WIDTH - PADDING, y: CORNER_CUT + PADDING}, {x: BAR_WIDTH - PADDING, y: BAR_HEIGHT - PADDING},
            {x: CORNER_CUT + PADDING, y: BAR_HEIGHT - PADDING}, {x: 0 + PADDING, y: BAR_HEIGHT - CORNER_CUT - PADDING}
        ];
        fill.fillPoints(fillPoints, true);

        const eraseX = currentFillWidth;
        const eraseWidth = BAR_WIDTH - currentFillWidth;

        if (eraseWidth > 0) {
            fill.fillStyle(BG_COLOR, BG_ALPHA);

            fill.fillRect(eraseX, 0, eraseWidth, BAR_HEIGHT);
        }
    };

    const destroy = () => {
        container.destroy();
    };

    return {
        container,
        update,
        destroy
    };
}