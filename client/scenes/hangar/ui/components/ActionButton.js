import Phaser from 'phaser';

const DEFAULTS = {
    x: 0,
    y: 0,
    texture: 'default_button',
    text: '',
    scale: 0.7,

    cooldown: 0,

};

const STYLES = {
    text: {
        fontFamily: 'Tektur',
        fontSize: '18px',
        color: '#ffffff',
    }
};

/**
 * @class ActionButton
 * @extends Phaser.GameObjects.Container
 * @description Переиспользуемый компонент кнопки с текстурой, текстом и встроенными состояниями.
 * Умеет отслеживать Promise для управления своим состоянием блокировки.
 */
export class ActionButton extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, finalConfig.x, finalConfig.y);

        this.config = finalConfig;
        this.isEnabled = true;

        this.isTracking = false;

        this._createUI();
        this._attachEventListeners();

        scene.add.existing(this);
    }

    _createUI() {
        this.buttonImage = this.scene.add.image(0, 0, this.config.texture)
            .setScale(this.config.scale)
            .setOrigin(0.5);

        this.buttonText = this.scene.add.text(0, 0, this.config.text, STYLES.text)
            .setOrigin(0.5);

        this.add([this.buttonImage, this.buttonText]);

        this.setSize(this.buttonImage.displayWidth, this.buttonImage.displayHeight);
        this.setInteractive({useHandCursor: true});
    }

    _attachEventListeners() {
        const originalScale = this.config.scale;
        const hoverScale = originalScale * 1.08;

        this.on('pointerover', () => {

            if (!this.isEnabled || this.isTracking) return;

            this.scene.tweens.add({
                targets: this.buttonImage,
                scale: hoverScale,
                duration: 150,
                ease: 'Sine.easeOut'
            });
        });

        this.on('pointerout', () => {
            this.scene.tweens.add({
                targets: this.buttonImage,
                scale: originalScale,
                duration: 150,
                ease: 'Sine.easeIn'
            });
        });

        this.on('pointerdown', () => {

            if (!this.isEnabled || this.isTracking) return;

            this.scene.tweens.add({
                targets: this.buttonImage,
                scale: originalScale * 0.95,
                duration: 80,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => {

                    if (this.isEnabled && !this.isTracking) {

                        this.emit('click');
                    }
                }
            });
        });
    }

    /**
     * Блокирует кнопку и отслеживает завершение асинхронной операции (Promise).
     * Автоматически разблокирует кнопку после завершения Promise и истечения кулдауна.
     * @param {Promise<any>} promise - Promise, который нужно отследить.
     */
    trackPromise(promise) {
        if (this.isTracking) {
            console.warn('ActionButton is already tracking a promise.');
            return;
        }

        this.isTracking = true;
        this.disable();

        const cooldownPromise = new Promise(resolve => {
            this.scene.time.delayedCall(this.config.cooldown, resolve);
        });

        Promise.all([promise, cooldownPromise]).then(() => {

        }).finally(() => {
            this.isTracking = false;

            if (this.active) {
                this.enable();
            }
        });
    }

    /**
     * Включает кнопку, делая ее кликабельной и непрозрачной.
     */
    enable() {

        if (this.isTracking) return;

        this.isEnabled = true;
        this.setAlpha(1);
        this.setInteractive();
    }

    enableState(isEnabled) {
        if (isEnabled) {
            this.enable();
        } else {
            this.disable();
        }
    }

    /**
     * Отключает кнопку, делая ее некликабельной и полупрозрачной.
     */
    disable() {
        this.isEnabled = false;
        this.setAlpha(0.5);
        this.disableInteractive();
    }
}