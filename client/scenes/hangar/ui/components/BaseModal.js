import Phaser from 'phaser';
import {ModalOverlay} from './ModalOverlay.js';

const BASE_WIDTH = 1920;

export class BaseModal extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene Сцена Phaser.
     * @param {Phaser.GameObjects.Container} content Контейнер с содержимым модального окна.
     */
    constructor(scene, content) {
        super(scene, 0, 0);
        this.setDepth(1000);

        this.overlay = new ModalOverlay(scene);
        this.content = content;

        this.add([this.overlay, this.content]);

        this.resizeHandler = () => this.centerContent();
        this.scene.scale.on('resize', this.resizeHandler);

        this.on('destroy', () => {
            this.scene.scale.off('resize', this.resizeHandler);
            if (this.overlay) this.overlay.destroy();
        });

        this.centerContent();
        scene.add.existing(this);
    }

    centerContent() {

        const scaleFactor = this.scene.scale.width / BASE_WIDTH;

        this.content.setPosition(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );

        this.content.setScale(scaleFactor);
    }

    show() {
        this.overlay.show();

        const targetScale = this.scene.scale.width / BASE_WIDTH;

        this.content.setScale(targetScale * 0.8).setAlpha(0);
        this.scene.tweens.add({
            targets: this.content,
            scale: targetScale,
            alpha: 1,
            duration: 300,
            ease: 'Back.Out'
        });
    }

    hide() {
        this.overlay.hide();

        const currentScale = this.content.scaleX;

        this.scene.tweens.add({
            targets: this.content,
            scale: currentScale * 0.8,
            alpha: 0,
            duration: 250,
            ease: 'Cubic.In',
            onComplete: () => {
                this.emit('close');
                this.destroy();
            }
        });
    }
}