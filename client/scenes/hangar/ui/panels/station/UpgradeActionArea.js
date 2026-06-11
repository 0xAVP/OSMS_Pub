import Phaser from 'phaser';
import {QuantityInput} from '../../components/qinput';
import {ActionButton} from '../../components/ActionButton.js';

const LAYOUT = {
    BUTTON_SPACING_X: 100,
    INPUT_TO_BUTTON_Y_GAP: 60,
};

/**
 * @class UpgradeActionArea
 * @extends Phaser.GameObjects.Container
 * @description
 * Компонент, содержащий инпут количества и кнопки действий ("Upgrade", "Replace")
 * для панели улучшения модуля.
 */
export class UpgradeActionArea extends Phaser.GameObjects.Container {
    constructor(scene, width) {
        super(scene, 0, 0);

        const centerX = width / 2;
        const buttonY = LAYOUT.INPUT_TO_BUTTON_Y_GAP;

        this.quantityInput = new QuantityInput(scene, centerX - 70, 0, {width: 80, showMaxButton: true});

        this.replaceButton = new ActionButton(this.scene, {
            x: centerX - (LAYOUT.BUTTON_SPACING_X / 2),
            y: buttonY,
            texture: 'change_module',
            scale: 0.8,
            cooldown: 500
        });

        this.actionButton = new ActionButton(this.scene, {
            x: centerX + (LAYOUT.BUTTON_SPACING_X / 2),
            y: buttonY,
            texture: 'upgrade',
            scale: 0.8,
            cooldown: 2000
        });

        this.add([this.quantityInput, this.replaceButton, this.actionButton]);

        this.quantityInput.on('change', (quantity) => this.emit('quantity-changed', quantity));
        this.actionButton.on('click', () => this.emit('upgrade-click'));
        this.replaceButton.on('click', () => this.emit('replace-click'));

        scene.add.existing(this);
    }

    /**
     * Обновляет состояние компонента.
     * @param {number} maxAmount - Максимально возможное количество для апгрейда.
     * @param {boolean} isActionPossible - Доступна ли кнопка апгрейда.
     */
    update(maxAmount, isActionPossible) {
        this.quantityInput.setDynamicMax(maxAmount);
        this.quantityInput.setValue(1, true);
        this.actionButton.enableState(isActionPossible);
    }
}