import Phaser from 'phaser';
import {BaseModal} from './BaseModal.js';
import {ActionButton} from './ActionButton.js';

const DEFAULTS = {
    width: 380,
    height: 180,
    padding: 25,
    buttonSpacing: 150
};

const STYLES = {
    BG_COLOR: 0x1a1c22,
    BG_ALPHA: 0.98,
    MESSAGE_FONT: {
        fontFamily: 'Tektur',
        fontSize: '16px',
        color: '#e0e0e0',
        align: 'center',
    }
};

function createModalContent(scene, config) {

    const width = config.width || DEFAULTS.width;
    const height = config.height || DEFAULTS.height;
    const padding = config.padding || DEFAULTS.padding;
    const spacing = config.buttonSpacing || DEFAULTS.buttonSpacing;

    const container = new Phaser.GameObjects.Container(scene, 0, 0);

    const bg = scene.add.graphics()
        .fillStyle(STYLES.BG_COLOR, STYLES.BG_ALPHA)
        .fillRoundedRect(-width / 2, -height / 2, width, height, 15);

    const buttonY = (height / 2) - 45;

    const textCenterY = (-height / 2 + buttonY) / 2;

    const messageText = scene.add.text(0, textCenterY, config.message, {
        ...STYLES.MESSAGE_FONT,
        wordWrap: {width: width - padding * 2}
    }).setOrigin(0.5, 0.5);

    const confirmButton = new ActionButton(scene, {x: -spacing / 2, y: buttonY, texture: 'confirm'});
    const cancelButton = new ActionButton(scene, {x: spacing / 2, y: buttonY, texture: 'cancel'});

    container.confirmButton = confirmButton;
    container.cancelButton = cancelButton;

    container.add([bg, messageText, confirmButton, cancelButton]);

    return container;
}

export class ConfirmationModal extends BaseModal {
    constructor(scene, config) {

        const content = createModalContent(scene, config);
        super(scene, content);

        this.confirmButton = content.confirmButton;
        this.cancelButton = content.cancelButton;
        this.onConfirmCallback = config.onConfirm;
        this.onCancelCallback = config.onCancel;

        this._attachEventListeners();
        this.show();
    }

    _attachEventListeners() {
        this.cancelButton.on('click', () => this._handleCancel());
        this.confirmButton.on('click', () => this._handleConfirm());
    }

    async _handleConfirm() {
        if (!this.onConfirmCallback) {
            this.hide();
            return;
        }

        this.setLoading(true);

        try {

            await this.onConfirmCallback();

            this.hide();

        } catch (error) {

            console.error("Confirmation action failed:", error);
            if (this.scene && this.active) {
                this.setLoading(false);
            }
        }
    }

    _handleCancel() {
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
        this.hide();
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.confirmButton.disable();
            this.cancelButton.disable();
        } else {
            if (this.scene && this.confirmButton.active) {
                this.confirmButton.enable();
                this.cancelButton.enable();
            }
        }
    }
}
