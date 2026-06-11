import Phaser from 'phaser';

export function createHudBar(scene, x, y, label, color) {

    const BASE_RESOLUTION = {width: 1920, height: 1080};

    const scaleFactor = Math.min(
        scene.startWidth / BASE_RESOLUTION.width,
        scene.startHeight / BASE_RESOLUTION.height
    );

    const BASE_DIMENSIONS = {
        width: 200,
        height: 30,
        cornerRadius: 10,
        padding: 6,
        textPadding: 15,
        fontSize: 12,
        shadowOffset: 1,
        shadowBlur: 2
    };

    const barWidth = Math.round(BASE_DIMENSIONS.width * scaleFactor);
    const barHeight = Math.round(BASE_DIMENSIONS.height * scaleFactor);
    const cornerRadius = Math.round(BASE_DIMENSIONS.cornerRadius * scaleFactor);
    const padding = Math.round(BASE_DIMENSIONS.padding * scaleFactor);
    const textPadding = Math.round(BASE_DIMENSIONS.textPadding * scaleFactor);
    const fontSize = Math.max(8, Math.round(BASE_DIMENSIONS.fontSize * scaleFactor));
    const shadowOffset = Math.max(1, Math.round(BASE_DIMENSIONS.shadowOffset * scaleFactor));
    const shadowBlur = Math.max(1, Math.round(BASE_DIMENSIONS.shadowBlur * scaleFactor));

    const container = scene.add.container(x, y)
        .setDepth(2)
        .setAlpha(0.7);

    const bg = scene.add.graphics();
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRoundedRect(0, 0, barWidth, barHeight, cornerRadius);
    container.add(bg);

    const fill = scene.add.graphics();
    container.add(fill);

    const baseTextStyle = {
        fontFamily: 'Tektur',
        color: '#ffffff',
        shadow: {
            offsetX: shadowOffset,
            offsetY: shadowOffset,
            color: '#000000',
            blur: shadowBlur,
            fill: true
        }
    };

    const labelText = scene.add.text(textPadding, barHeight / 2, label, {
        ...baseTextStyle,
        fontSize: `${fontSize}px`,
        fontStyle: '600'
    }).setOrigin(0, 0.5);
    container.add(labelText);

    const valueText = scene.add.text(barWidth - textPadding, barHeight / 2, '0', {
        ...baseTextStyle,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold'
    }).setOrigin(1, 0.5);
    container.add(valueText);

    let maxValue = 100;

    const update = (currentValue, newMaxValue) => {
        if (newMaxValue !== undefined) {
            maxValue = newMaxValue > 0 ? newMaxValue : 1;
        }
        if (maxValue === 0) return;

        const percentage = Phaser.Math.Clamp(currentValue / maxValue, 0, 1);
        const currentText = Number.isFinite(currentValue) ? currentValue.toFixed(2) : '0.00';
        const maxText = Number.isFinite(maxValue) ? maxValue.toFixed(2) : '0.00';
        valueText.setText(`${currentText}/${maxText}`);

        const fillX = padding;
        const fillY = padding;
        const fillMaxWidth = barWidth - (padding * 2);
        const fillHeight = barHeight - (padding * 2);
        const fillCornerRadius = cornerRadius > padding ? cornerRadius - padding : 0;
        const currentFillWidth = fillMaxWidth * percentage;

        fill.clear();
        fill.fillStyle(color, 1);
        fill.fillRoundedRect(fillX, fillY, currentFillWidth, fillHeight, fillCornerRadius);
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