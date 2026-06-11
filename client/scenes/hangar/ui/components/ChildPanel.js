import Phaser from 'phaser';

const DEFAULTS = {
    width: 320,
    height: 600,
    title: 'Details',
    padding: 20,
    titleHeight: 50,
    closeButtonSize: 32,
    alignX: 'left',
    alignY: 'top',
    offsetY: 100,
    gap: 20,
    useScanAnimation: true
};

const STYLES = {
    bgColor: 0x1A1325,
    bgAlpha: 0.85,
    title: {fontFamily: 'Tektur', fontSize: '20px', color: '#ffffff'},
    scanLineColor: 0x41C6FF,
    scanLineAlpha: 0.4,
    scanLineWidth: 3,
};

const SCANLINE_ANIMATION_DURATION = 1500;

export class ChildPanel extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, 0, 0);

        this.config = {...DEFAULTS, ...config};
        this.content = null;
        this.scanLineTween = null;
        this.setDepth(100);

        this._createUI();

        const hitArea = new Phaser.Geom.Rectangle(0, 0, this.config.width, this.config.height);
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.setVisible(false).setAlpha(0);
    }

    _createUI() {
        const {width, height} = this.config;
        const backgroundGraphics = this.scene.add.graphics()
            .fillStyle(STYLES.bgColor, STYLES.bgAlpha)
            .fillRoundedRect(0, 0, width, height, 10);
        this.add(backgroundGraphics);

        this.scanLine = this.scene.add.rectangle(
            width / 2,
            0,
            width,
            STYLES.scanLineWidth,
            STYLES.scanLineColor,
            STYLES.scanLineAlpha
        ).setAlpha(0);

        this.add(this.scanLine);

    }

    _startScanAnimation() {
        if (this.scanLineTween) {
            this.scanLineTween.stop();
            this.scanLineTween = null;
        }

        const {height} = this.config;

        this.scanLine.setY(0).setAlpha(STYLES.scanLineAlpha);

        this.scanLineTween = this.scene.tweens.add({
            targets: this.scanLine,
            y: height,
            alpha: 0.0,
            duration: SCANLINE_ANIMATION_DURATION,
            ease: 'Linear',
            repeat: 0,
            onComplete: () => {

                this.scanLine.setAlpha(0);
            }
        });

    }

    _stopScanAnimation() {
        if (this.scanLineTween) {
            this.scanLineTween.stop();
            this.scanLineTween = null;
        }

        if (this.scanLine) {
            this.scanLine.setAlpha(0);
        }
    }

    show(content, title = 'Details', parentContentContainer) {
        const wasVisible = this.visible;

        if (this.content) this.content.destroy();

        this.content = content;
        this.content.setPosition(
            this.config.padding,
            this.config.padding
        );
        this.add(this.content);

        const sidePanel = this.parentContainer;
        if (!sidePanel) {
            console.error("ChildPanel cannot be shown without a parent SidePanel.");
            return;
        }

        let targetX;
        let targetY;
        const {alignX, alignY, gap, width, height, offsetY} = this.config;
        const parentWidth = sidePanel.panelWidth;
        const parentHeight = sidePanel.panelHeight || (sidePanel.scene.scale.height / sidePanel.scaleY);

        switch (alignX) {
            case 'left':
                targetX = -width - gap;
                break;
            case 'right':
                targetX = parentWidth + gap;
                break;
            default:
                targetX = (parentWidth - width) / 2;
                break;
        }

        switch (alignY) {
            case 'top':
                targetY = 0;
                break;
            case 'center':
                targetY = (parentHeight - height) / 2;
                break;
            case 'bottom':
                targetY = parentHeight - height;
                break;
            default:
                targetY = 0;
                break;
        }

        targetY += offsetY;

        this.setPosition(targetX, targetY);

        if (wasVisible) {
            this.setAlpha(1);
            this.setVisible(true);
        } else {
            this.setVisible(true);
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                duration: 300,
                ease: 'Sine.easeOut',
                onStart: () => {
                    if (this.config.useScanAnimation) {
                        this._startScanAnimation();
                    }
                }
            });
        }
    }

    hide() {
        this._stopScanAnimation();

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 200,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.setVisible(false);
                if (this.content) {
                    this.content.destroy();
                    this.content = null;
                }
            }
        });
    }

    destroy(fromScene) {

        this._stopScanAnimation();
        if (this.content) this.content.destroy();
        super.destroy(fromScene);
    }
}