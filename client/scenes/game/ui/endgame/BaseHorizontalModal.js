import Phaser from 'phaser';
import {DEPTHS} from "../depths";

/**
 * Базовый класс для полноширинных горизонтальных модальных панелей.
 * НЕ СОДЕРЖИТ собственного оверлея. Затемнение управляется извне.
 */
export class BaseHorizontalModal {
    constructor(scene, height) {
        this.scene = scene;
        this.scale = scene.scaleValue;
        this.width = scene.scale.width;
        this.height = this.scale(height);

        const initialX = scene.scale.width + this.width / 2;
        const initialY = scene.scale.height / 2;

        this.container = scene.add.container(initialX, initialY)
            .setDepth(DEPTHS.UI_MODAL)
            .setAlpha(0);

        this.contentContainer = scene.add.container(0, 0);
        this.container.add(this.contentContainer);
    }

    _createBackground(accentColor) {
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0A0C14, 0.95);
        bg.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        this.contentContainer.add(bg);
    }

    show() {

        this.scene.tweens.add({
            targets: this.container,
            x: this.scene.scale.width / 2,
            alpha: 1,
            duration: 600,
            ease: 'Cubic.easeOut',
            delay: 100
        });
    }

    dismiss() {

        this.scene.tweens.add({
            targets: this.container,
            x: -this.width / 2,
            alpha: 0,
            duration: 500,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                if (this.container) {
                    this.container.destroy();
                }
            }
        });
    }
}