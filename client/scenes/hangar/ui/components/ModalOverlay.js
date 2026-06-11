import Phaser from 'phaser';

const DEFAULTS = {
    color: 0x0a030f,
    alpha: 0.8,
    animationDuration: 300,
};

export class ModalOverlay extends Phaser.GameObjects.Container {
    constructor(scene, config = {}) {
        super(scene, 0, 0);
        this.config = {...DEFAULTS, ...config};
        this.setDepth(999);

        this.background = this.scene.add.rectangle(0, 0, 1, 1, this.config.color, 1)
            .setOrigin(0, 0)
            .setInteractive()
            .on('pointerdown', (p, x, y, e) => e.stopPropagation());

        this.add(this.background);
        this.setAlpha(0);

        this.resizeHandler = () => this._updateSize();
        this.scene.scale.on('resize', this.resizeHandler);

        this.on('destroy', () => {
            this.scene.scale.off('resize', this.resizeHandler);
        });

        this._updateSize();

    }

    _updateSize() {
        this.background.setSize(this.scene.scale.width, this.scene.scale.height);
    }

    show() {
        this.scene.tweens.killTweensOf(this);
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this,
                alpha: this.config.alpha,
                duration: this.config.animationDuration,
                ease: 'Cubic.Out',
                onComplete: resolve
            });
        });
    }

    hide() {
        this.scene.tweens.killTweensOf(this);
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: this.config.animationDuration,
                ease: 'Cubic.In',
                onComplete: resolve
            });
        });
    }
}