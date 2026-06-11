import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../core/utils.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';

const LAYOUT = {
    SPRITE_TARGET_WIDTH: 167,
    AVATAR_TO_NAME_GAP: 15,
};

const STYLES = {
    handle: {fontFamily: 'Tektur', fontSize: '18px', color: '#e0e0e0'},
    stripe: {
        color: 0xffffff,
        alpha: 0.1,
        hoverAlpha: 0.25
    }
};

export class PilotSelectionPanelContent extends Phaser.GameObjects.Container {
    constructor(scene, panelConfig) {
        super(scene, 0, 0);
        this.panelConfig = panelConfig;
        this.currentPilotId = null;
        this._createUI();
    }

    _createUI() {
        const contentWidth = this.panelConfig.width;
        const contentHeight = this.panelConfig.height;
        const centerX = contentWidth / 2;

        this.pilotAvatar = this.scene.add.sprite(centerX, 0, '').setOrigin(0.5);

        this.arrowStripeLeft = this.scene.add.rectangle(0, 0, 1, 1, STYLES.stripe.color, STYLES.stripe.alpha)
            .setOrigin(0, 0)
            .setInteractive({useHandCursor: true});

        this.arrowStripeRight = this.scene.add.rectangle(0, 0, 1, 1, STYLES.stripe.color, STYLES.stripe.alpha)
            .setOrigin(0, 0)
            .setInteractive({useHandCursor: true});

        const handleCenterY = contentHeight - (this.panelConfig.handleSize / 2);
        this.handleNameText = this.scene.add.text(centerX, handleCenterY, '', STYLES.handle).setOrigin(0.5);

        this.add([
            this.pilotAvatar,
            this.arrowStripeLeft, this.arrowStripeRight,
            this.handleNameText
        ]);

        this.arrowStripeLeft.on('pointerdown', () => this.scene.selectPilot(-1));
        this.arrowStripeRight.on('pointerdown', () => this.scene.selectPilot(1));

        this.arrowStripeLeft.on('pointerover', () => this.arrowStripeLeft.setFillStyle(STYLES.stripe.color, STYLES.stripe.hoverAlpha));
        this.arrowStripeLeft.on('pointerout', () => this.arrowStripeLeft.setFillStyle(STYLES.stripe.color, STYLES.stripe.alpha));

        this.arrowStripeRight.on('pointerover', () => this.arrowStripeRight.setFillStyle(STYLES.stripe.color, STYLES.stripe.hoverAlpha));
        this.arrowStripeRight.on('pointerout', () => this.arrowStripeRight.setFillStyle(STYLES.stripe.color, STYLES.stripe.alpha));

    }

    updateContent() {
        if (!this.scene || !this.active) {
            return;
        }

        const selectedPilot = this.scene.selectedPilot;
        if (!selectedPilot) return;

        this.currentPilotId = selectedPilot.id;

        const baseTextureKey = selectedPilot.image;
        const {textureKey, scale} = selectTextureAndScale(this.scene, baseTextureKey, LAYOUT.SPRITE_TARGET_WIDTH);

        if (this.scene.textures.exists(textureKey)) {
            this.pilotAvatar.setTexture(textureKey).setScale(scale).setVisible(true);
        } else {
            console.error(`[PilotPanel] Texture not found for pilot: "${textureKey}"`);
            this.pilotAvatar.setVisible(false);
            return;
        }

        const avatarHeight = this.pilotAvatar.displayHeight;
        const avatarWidth = this.pilotAvatar.displayWidth;

        const centerX = this.panelConfig.width / 2;

        const avatarY = avatarHeight / 2;
        this.pilotAvatar.setPosition(centerX, avatarY);

        const zoneWidthLeft = centerX - (avatarWidth / 2);
        const zoneWidthRight = this.panelConfig.width - (centerX + avatarWidth / 2);

        this.arrowStripeLeft
            .setPosition(0, avatarY - avatarHeight / 2)
            .setSize(zoneWidthLeft, avatarHeight);

        this.arrowStripeRight
            .setPosition(centerX + avatarWidth / 2, avatarY - avatarHeight / 2)
            .setSize(zoneWidthRight, avatarHeight);

        const pilotsCount = this.scene.pilots.length;
        this.arrowStripeLeft.setVisible(pilotsCount > 1).setActive(pilotsCount > 1);
        this.arrowStripeRight.setVisible(pilotsCount > 1).setActive(pilotsCount > 1);

        this.handleNameText.setText(selectedPilot.name.toUpperCase());
    }
}