import Phaser from 'phaser';

export default class TextButton extends Phaser.GameObjects.Container {

    /**
     * @param {Phaser.Scene} scene - Сцена, на которой будет создана кнопка.
     * @param {number} x - Координата X.
     * @param {number} y - Координата Y.
     * @param {string} text - Текст на кнопке.
     * @param {function} callback - Функция, которая будет вызвана при нажатии.
     */
    constructor(scene, x, y, text, callback) {

        super(scene, x, y);

        const buttonText = scene.add.text(0, 0, text, {
            fontFamily: 'Tektur',
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);

        const buttonBackground = scene.add.rectangle(0, 0, buttonText.width + 80, buttonText.height + 40, 0x1a2b3c);

        this.add([buttonBackground, buttonText]);

        this.setSize(buttonBackground.width, buttonBackground.height);

        this.setInteractive({useHandCursor: true});

        this.on('pointerdown', () => {
            callback();
        });

        this.on('pointerover', () => {
            buttonBackground.setFillStyle(0x2a5d77);
        });

        this.on('pointerout', () => {
            buttonBackground.setFillStyle(0x1a2b3c);
        });

        scene.add.existing(this);
    }
}