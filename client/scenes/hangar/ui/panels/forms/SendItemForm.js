import Phaser from 'phaser';
import {ActionButton} from '../../components/ActionButton.js';
import {QuantityInput} from '../../components/qinput';
import {TextInput} from '../../components/TextInput.js';

const LAYOUT = {
    PANEL_WIDTH: 550,
    PANEL_HEIGHT: 280,
    CORNER_RADIUS: 10,
    PADDING: 25,
    TITLE_Y: -105,
    QUANTITY_Y: -45,
    RECIPIENT_Y: 20,
    BUTTON_Y: 95,
    BUTTON_SPACING: 150,
};

const STYLES = {
    BG_COLOR: 0x1a1c22,
    BG_ALPHA: 0.85,
    TITLE_FONT: {fontFamily: 'Tektur', fontSize: '16px', color: '#cccccc'},
    ITEM_NAME_FONT: {fontFamily: 'Tektur', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'},
    LABEL_FONT: {fontFamily: 'Tektur', fontSize: '16px', color: '#cccccc'},
    INVALID_INPUT_BG_COLOR: 0x552222,
};

/**
 * @class SendItemForm
 * @extends Phaser.GameObjects.Container
 * @description
 * UI-компонент, представляющий собой форму для отправки предмета.
 * Он содержит поля ввода, кнопки и отвечает за базовую валидацию.
 * Генерирует события 'confirm' и 'cancel' вместо прямого выполнения действий.
 *
 * @event confirm - Генерируется при подтверждении отправки. Передает { recipientAddress, quantity }.
 * @event cancel - Генерируется при отмене действия.
 */
export class SendItemForm extends Phaser.GameObjects.Container {
    constructor(scene, itemData) {
        super(scene, 0, 0);
        this.currentItem = itemData;
        this._createUI();
    }

    /**
     * Создает все визуальные элементы формы.
     * @private
     */
    /**
     * Создает все визуальные элементы формы.
     * @private
     */
    _createUI() {

        const bg = this.scene.add.graphics()
            .fillStyle(STYLES.BG_COLOR, STYLES.BG_ALPHA)
            .fillRoundedRect(-LAYOUT.PANEL_WIDTH / 2, -LAYOUT.PANEL_HEIGHT / 2, LAYOUT.PANEL_WIDTH, LAYOUT.PANEL_HEIGHT, LAYOUT.CORNER_RADIUS)
            .setInteractive(new Phaser.Geom.Rectangle(-LAYOUT.PANEL_WIDTH / 2, -LAYOUT.PANEL_HEIGHT / 2, LAYOUT.PANEL_WIDTH, LAYOUT.PANEL_HEIGHT), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', (p, x, y, e) => e.stopPropagation());

        const initialHeaderText = `Sending: ${this.currentItem.name || this.currentItem.key} x1`;
        this.headerText = this.scene.add.text(
            -LAYOUT.PANEL_WIDTH / 2 + LAYOUT.PADDING,
            LAYOUT.TITLE_Y,
            initialHeaderText,
            {...STYLES.TITLE_FONT, ...STYLES.ITEM_NAME_FONT}
        ).setOrigin(0, 0.5);

        const quantityLabel = this.scene.add.text(-LAYOUT.PANEL_WIDTH / 2 + LAYOUT.PADDING, LAYOUT.QUANTITY_Y, 'Quantity:', STYLES.LABEL_FONT).setOrigin(0, 0.5);
        this.quantityInput = new QuantityInput(this.scene, quantityLabel.x + quantityLabel.width + 80, LAYOUT.QUANTITY_Y, {
            width: 80,
            showMaxButton: true,
            maxValue: Math.min(this.currentItem.quantity || 1, 9999),
            initialValue: 1,
        });

        this.quantityInput.on('change', (quantity) => {

            const newHeaderText = `Sending: ${this.currentItem.name || this.currentItem.key} x${quantity}`;
            this.headerText.setText(newHeaderText);
        });

        this.recipientInput = new TextInput(this.scene, 0, LAYOUT.RECIPIENT_Y, {
            width: LAYOUT.PANEL_WIDTH - LAYOUT.PADDING * 2,
            placeholder: 'Enter recipient address (0x...)'
        });

        this.confirmButton = new ActionButton(this.scene, {
            x: -LAYOUT.BUTTON_SPACING / 2,
            y: LAYOUT.BUTTON_Y,
            texture: 'send',
            scale: 0.8,
            cooldown: 2000
        });
        this.cancelButton = new ActionButton(this.scene, {
            x: LAYOUT.BUTTON_SPACING / 2,
            y: LAYOUT.BUTTON_Y,
            texture: 'cancel',
            scale: 0.8
        });

        this.cancelButton.on('click', () => {
            this.emit('cancel');
        });

        this.confirmButton.on('click', () => {
            const recipientAddress = this.recipientInput.text.trim();
            const quantity = this.quantityInput.getValue();

            if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
                this._showInvalidInputFeedback();
                return;
            }

            this.emit('confirm', {recipientAddress, quantity});
        });

        this.add([
            bg, this.headerText,
            quantityLabel, this.quantityInput,
            this.recipientInput,
            this.confirmButton, this.cancelButton
        ]);
    }

    /**
     * Показывает визуальную обратную связь для невалидного ввода адреса.
     * @private
     */
    _showInvalidInputFeedback() {

        const originalBgColor = this.recipientInput.background.fillColor;

        this.recipientInput.background.fillStyle(STYLES.INVALID_INPUT_BG_COLOR, STYLES.BG_ALPHA);
        this.recipientInput.background.fillRoundedRect(
            -this.recipientInput.config.width / 2,
            -this.recipientInput.config.height / 2,
            this.recipientInput.config.width,
            this.recipientInput.config.height,
            this.recipientInput.config.style.cornerRadius
        );

        this.scene.tweens.add({
            targets: this.recipientInput,
            x: '+=5',
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => {

                if (this.recipientInput) {
                    this.recipientInput.x = 0;
                }

                this.recipientInput.background.fillStyle(originalBgColor, STYLES.BG_ALPHA);
                this.recipientInput.background.fillRoundedRect(
                    -this.recipientInput.config.width / 2,
                    -this.recipientInput.config.height / 2,
                    this.recipientInput.config.width,
                    this.recipientInput.config.height,
                    this.recipientInput.config.style.cornerRadius
                );
            }
        });
    }
}