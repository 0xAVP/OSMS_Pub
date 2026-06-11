import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../core/utils.js';
import {RARITY_COLORS} from '../../constants.js';
import {getDefaultIconForSlot, getModuleByType, getSlotDisplayName} from '../panels/station/stationUtils.js';

const LABEL_CONFIG = {
    WIDTH: 140,
    HEIGHT: 65,
    CORNER_RADIUS: 5,
    BG_COLOR: 0x1A1325,
    BG_ALPHA: 0.85,
};

const LABEL_STYLES = {
    slotName: {fontFamily: 'Tektur', fontSize: '12px', color: '#a0a0a0'},
    moduleName: {fontFamily: 'Tektur', fontSize: '14px', color: '#ffffff'},
    level: {fontFamily: 'Tektur', fontSize: '12px', color: '#FEBA00'},
};

const LAYOUT = {
    ICON_TO_BG_RATIO: 0.75,
};

export class ModuleSlot extends Phaser.GameObjects.Container {
    constructor(scene, x, y, slotKey) {
        super(scene, x, y);
        this.slotKey = slotKey;
        this.bgSize = 100;

        this._createUI();
        this._attachEventListeners();
        scene.add.existing(this);
    }

    _createUI() {

        this.iconBackground = this.scene.add.graphics();
        this.icon = this.scene.add.image(0, 0, '');

        this.hoverEffect = this.scene.add.graphics();

        this.labelContainer = this.scene.add.container(0, 0);

        const labelBg = this.scene.add.graphics();
        labelBg.fillStyle(LABEL_CONFIG.BG_COLOR, LABEL_CONFIG.BG_ALPHA)
            .fillRoundedRect(-LABEL_CONFIG.WIDTH / 2, -LABEL_CONFIG.HEIGHT / 2, LABEL_CONFIG.WIDTH, LABEL_CONFIG.HEIGHT, LABEL_CONFIG.CORNER_RADIUS);

        const verticalGap = 16;
        this.slotNameText = this.scene.add.text(0, -verticalGap, '', LABEL_STYLES.slotName).setOrigin(0.5);
        this.moduleNameText = this.scene.add.text(0, 0, '', LABEL_STYLES.moduleName).setOrigin(0.5);
        this.levelText = this.scene.add.text(0, verticalGap, '', LABEL_STYLES.level).setOrigin(0.5);

        this.labelContainer.add([labelBg, this.slotNameText, this.moduleNameText, this.levelText]);
        this.labelContainer.setVisible(false);

        this.add([this.iconBackground, this.hoverEffect, this.icon, this.labelContainer]);
    }

    _attachEventListeners() {
        const initialHitArea = new Phaser.Geom.Circle(0, 0, this.bgSize / 2);

        this.hoverFadeInTween = null;
        this.hoverPulseTween = null;
        this.hoverFadeOutTween = null;

        this.setInteractive({
            hitArea: initialHitArea,
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true
        })
            .on('pointerdown', () => this.emit('slot-clicked', this.slotKey))

            .on('pointerover', () => {

                if (this.hoverFadeOutTween) this.hoverFadeOutTween.stop();

                const moduleData = getModuleByType(this.scene, this.slotKey);
                const rarity = moduleData?.rarity || 'default';
                const rarityColor = RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.default;

                this.hoverEffect.clear()
                    .lineStyle(3, rarityColor, 1)
                    .strokeCircle(0, 0, this.bgSize / 2 + 1)
                    .setAlpha(0)
                    .setScale(0.95);

                this.hoverFadeInTween = this.scene.tweens.add({
                    targets: this.hoverEffect,
                    alpha: 1.0,
                    scale: 1.0,
                    duration: 250,
                    ease: 'Sine.easeOut',
                    onComplete: () => {

                        if (!this.scene) return;

                        this.hoverPulseTween = this.scene.tweens.add({
                            targets: this.hoverEffect,
                            alpha: {from: 1.0, to: 0.6},
                            duration: 800,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                });

                this.icon.setTint(0xffffff);
            })

            .on('pointerout', () => {

                if (this.hoverFadeInTween) this.hoverFadeInTween.stop();
                if (this.hoverPulseTween) this.hoverPulseTween.stop();

                this.hoverFadeOutTween = this.scene.tweens.add({
                    targets: this.hoverEffect,
                    alpha: 0,
                    scale: 0.95,
                    duration: 200,
                    ease: 'Sine.easeIn',
                    onComplete: () => {
                        if (this.hoverEffect) {
                            this.hoverEffect.clear();
                        }
                    }
                });

                const moduleData = getModuleByType(this.scene, this.slotKey);
                if (!moduleData) {
                    this.icon.setTint(0x41C6FF);
                } else {
                    this.icon.clearTint();
                }
            });
    }

    update(moduleData, newSize = this.bgSize, scaleFactor = 1) {
        if (this.bgSize !== newSize) {
            this.bgSize = newSize;
        }

        this.input.hitArea.radius = this.bgSize / 2;
        const targetIconSize = this.bgSize * LAYOUT.ICON_TO_BG_RATIO;

        if (moduleData && moduleData.key) {
            const {textureKey} = selectTextureAndScale(this.scene, moduleData.key, targetIconSize);
            this.icon.setTexture(textureKey).setVisible(true).setTint(0xffffff);
            const texFilled = this.scene.textures.get(textureKey);
            if (texFilled.key !== '__MISSING') {
                const aspect = texFilled.source[0].width / texFilled.source[0].height;
                this.icon.setDisplaySize(targetIconSize, targetIconSize / aspect);
            }
            const rarityColor = RARITY_COLORS[moduleData.rarity.toLowerCase()] || 0xffffff;
            this.iconBackground.clear().fillStyle(0x000000, 0.3).lineStyle(2, rarityColor, 0.8).fillCircle(0, 0, this.bgSize / 2).strokeCircle(0, 0, this.bgSize / 2);
        } else {
            const defaultTextureKey = getDefaultIconForSlot(this.slotKey);
            const {textureKey} = selectTextureAndScale(this.scene, defaultTextureKey, targetIconSize);
            this.icon.setTexture(textureKey).setVisible(true).setTint(0x41C6FF);
            const texEmpty = this.scene.textures.get(textureKey);
            if (texEmpty.key !== '__MISSING') {
                const aspect = texEmpty.source[0].width / texEmpty.source[0].height;
                this.icon.setDisplaySize(targetIconSize, targetIconSize / aspect);
            }
            this.iconBackground.clear().fillStyle(0x000000, 0.3).lineStyle(1.5, 0x41C6FF, 0.3).fillCircle(0, 0, this.bgSize / 2).strokeCircle(0, 0, this.bgSize / 2);
        }

        const slotDisplayName = getSlotDisplayName(this.slotKey);
        const nameToShow = moduleData?.name || 'Empty slot';
        const levelToShow = (moduleData && typeof moduleData.level === 'number') ? `Lvl: ${moduleData.level}` : 'Lvl: -';
        const rarity = moduleData?.rarity || 'default';
        const rarityColor = RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.default;
        this.slotNameText.setText(slotDisplayName.toUpperCase());
        this.moduleNameText.setText(nameToShow);
        this.levelText.setText(levelToShow);
        this.moduleNameText.setColor(`#${rarityColor.toString(16).padStart(6, '0')}`);
        if (!moduleData) {
            this.moduleNameText.setColor(LABEL_STYLES.slotName.color);
        }

        this.labelContainer.setScale(scaleFactor);

        const scaledPlaqueHeight = LABEL_CONFIG.HEIGHT * scaleFactor;
        const scaledGap = 5 * scaleFactor;

        this.labelContainer.setY((this.bgSize / 2) + (scaledPlaqueHeight / 2) + scaledGap);
        this.labelContainer.setVisible(true);
    }
}