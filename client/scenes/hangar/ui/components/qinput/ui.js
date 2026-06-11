/**
 * Фабричная функция для создания визуальных элементов компонента QuantityInput.
 * @param {Phaser.Scene} scene - Сцена Phaser.
 * @param {object} config - Объект конфигурации, основанный на DEFAULTS.
 * @returns {object} - Объект, содержащий ссылки на созданные UI-элементы.
 */
export function createUI(scene, config) {
    const {width, height, buttonSize, maxButtonWidth, gap, showMaxButton, style} = config;

    const ui = {};

    ui.inputBg = scene.add.graphics()
        .fillStyle(style.bgColor, 1)
        .fillRoundedRect(-width / 2, -height / 2, width, height, style.cornerRadius);

    ui.inputText = scene.add.text(0, 0, config.initialValue.toString(), {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.textColor,
        align: 'center'
    }).setOrigin(0.5);

    const plusButtonX = width / 2 + gap;
    ui.plusButton = scene.add.graphics()
        .fillStyle(style.buttonBgColor, 1)
        .fillRoundedRect(plusButtonX, -buttonSize / 2, buttonSize, buttonSize, style.cornerRadius);
    ui.plusText = scene.add.text(plusButtonX + buttonSize / 2, 0, '+', {...ui.inputText.style}).setOrigin(0.5);

    const minusButtonX = -width / 2 - gap - buttonSize;
    ui.minusButton = scene.add.graphics()
        .fillStyle(style.buttonBgColor, 1)
        .fillRoundedRect(minusButtonX, -buttonSize / 2, buttonSize, buttonSize, style.cornerRadius);
    ui.minusText = scene.add.text(minusButtonX + buttonSize / 2, 0, '−', {...ui.inputText.style}).setOrigin(0.5);

    if (showMaxButton) {
        const maxButtonX = plusButtonX + buttonSize + gap;
        ui.maxButtonBg = scene.add.graphics()
            .fillStyle(style.buttonBgColor, 1)
            .fillRoundedRect(maxButtonX, -buttonSize / 2, maxButtonWidth, buttonSize, style.cornerRadius);
        ui.maxButtonText = scene.add.text(maxButtonX + maxButtonWidth / 2, 0, 'MAX', {...ui.inputText.style}).setOrigin(0.5);
    }

    return ui;
}
