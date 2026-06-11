import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../../../core/utils.js';

const STYLES = {
    SHIP_NAME: {fontFamily: 'Tektur', fontSize: '28px', color: '#FEBA00'},
    PAGE_TEXT: {fontFamily: 'Tektur', fontSize: '24px', color: '#FFFFFF'},
};

export class ShipProjection extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        this._createUI();
    }

    _createUI() {
        const SHIP_IMAGE_Y = -50;

        this.projectionDisc = this.scene.add.image(0, SHIP_IMAGE_Y + 220, 'projection_disc_glow')
            .setAlpha(0.7).setDisplaySize(480, 120);

        this.scene.tweens.add({
            targets: this.projectionDisc,
            alpha: 0.9,
            scaleY: 1.1,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.shipImage = this.scene.add.image(0, SHIP_IMAGE_Y, 'placeholder').setOrigin(0.5);

        this.scene.tweens.add({
            targets: this.shipImage,
            y: SHIP_IMAGE_Y - 15,
            duration: 2500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });

        const PAGE_SELECTOR_Y = 280;
        this.arrowLeft = this.scene.add.image(-150, PAGE_SELECTOR_Y, 'arrowL').setInteractive({useHandCursor: true}).setScale(1.5);
        this.arrowRight = this.scene.add.image(150, PAGE_SELECTOR_Y, 'arrowR').setInteractive({useHandCursor: true}).setScale(1.5);
        this.pageText = this.scene.add.text(0, PAGE_SELECTOR_Y, '', STYLES.PAGE_TEXT).setOrigin(0.5);

        this.arrowLeft.on('pointerdown', () => this.emit('prev-page'));
        this.arrowRight.on('pointerdown', () => this.emit('next-page'));

        this.add([
            this.projectionDisc, this.shipImage,
            this.arrowLeft, this.arrowRight, this.pageText
        ]);
    }

    update(shipData, currentPage, totalPages) {
        const {textureKey, scale} = selectTextureAndScale(this.scene, shipData.name, 540);
        this.shipImage.setTexture(textureKey).setScale(scale);
        this.shipImage.setAlpha(0).setScale(scale * 0.8);
        this.scene.tweens.add({targets: this.shipImage, alpha: 1, scale: scale, duration: 400, ease: 'Power2'});

        this.pageText.setText(`${currentPage + 1} / ${totalPages}`);
        this.arrowLeft.setVisible(currentPage > 0);
        this.arrowRight.setVisible(currentPage < totalPages - 1);
    }
}