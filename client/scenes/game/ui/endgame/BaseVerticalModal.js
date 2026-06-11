import Phaser from 'phaser';
import {DEPTHS} from "../depths";

/**
 * Базовый класс для создания модальных окон, занимающих всю высоту экрана.
 * НЕ СОДЕРЖИТ собственного оверлея. Затемнение управляется извне.
 */
export class BaseVerticalModal {
    /**
     * @param {Phaser.Scene} scene - Игровая сцена.
     * @param {number} width - Базовая ширина окна (будет адаптирована).
     */
    constructor(scene, width) {
        this.scene = scene;
        this.scale = scene.scaleValue;

        this.width = this.scale(width);

        this.height = scene.scale.height;

        this.container = scene.add.container(scene.scale.width / 2, -this.height)
            .setDepth(DEPTHS.UI_MODAL);

        this.contentContainer = scene.add.container(0, 0);
        this.container.add(this.contentContainer);
    }

    _createBackground(accentColor) {
        const bg = this.scene.add.graphics();
        const frame = this.scene.add.graphics();

        const topColor = Phaser.Display.Color.HexStringToColor('#101525').color;
        const bottomColor = Phaser.Display.Color.HexStringToColor('#0A0C14').color;
        bg.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 0.95);

        bg.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        bg.setAlpha(0.98);

        frame.lineStyle(this.scale(2), accentColor, 0.7);

        frame.beginPath();
        frame.moveTo(-this.width / 2, -this.height / 2);
        frame.lineTo(-this.width / 2, this.height / 2);
        frame.strokePath();

        frame.beginPath();
        frame.moveTo(this.width / 2, -this.height / 2);
        frame.lineTo(this.width / 2, this.height / 2);
        frame.strokePath();

        this.contentContainer.add([bg, frame]);
    }

    _createReturnButton() {
        const buttonY = (this.height / 2) - this.scale(65);
        const buttonWidth = this.scale(320);
        const buttonHeight = this.scale(60);

        const ratingTextY = buttonY - (buttonHeight / 2) - this.scale(40);
        const ratingText = this.scene.add.text(0, ratingTextY, 'Player rating is being updated...', {
            fontFamily: 'Tektur',
            fontSize: `${this.scale(20)}px`,
            color: '#aaaaaa',
            fontStyle: 'italic',
            align: 'center'
        }).setOrigin(0.5);

        const button = this.scene.add.container(0, buttonY);
        const bg = this.scene.add.graphics();
        bg.fillStyle(0xffffff, 0.1);
        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);

        const label = this.scene.add.text(0, 0, 'RETURN TO HANGAR', {
            fontFamily: 'Tektur',
            fontSize: `${this.scale(20)}px`,
            color: '#ffffff',
            fontStyle: '600'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(buttonWidth, buttonHeight).setInteractive({useHandCursor: true});

        button.on('pointerdown', () => this.scene.returnToHangar());
        button.on('pointerover', () => bg.fillGradientStyle(0x41C6FF, 0x41C6FF, 0x00A2FF, 0x00A2FF, 0.3));
        button.on('pointerout', () => bg.fillStyle(0xffffff, 0.1));

        this.contentContainer.add(ratingText);
        this.contentContainer.add(button);
    }

    show() {

        this.scene.tweens.add({
            targets: this.container,
            y: this.scene.scale.height / 2,
            duration: 600,
            ease: 'Back.easeOut',
            delay: 100
        });
    }

    dismiss() {

        this.scene.tweens.add({
            targets: this.container,
            y: -this.height * 2,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                if (this.container) {
                    this.container.destroy();
                }
            }
        });
    }
}