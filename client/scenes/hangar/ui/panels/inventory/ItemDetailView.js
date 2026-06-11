import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../../core/utils.js';
import {RARITY_COLORS} from '../../../constants.js';
import {StatsDisplay} from './components/StatsDisplay.js';

const LAYOUT_CONFIG = {
    ICON_SIZE: 100,
    ICON_TO_STATS_Y_GAP: 30,
};

const GLOW_EFFECT = {
    TEXTURE_KEY: 'projection_disc_glow',
    WIDTH_MULTIPLIER: 1.25,
    HEIGHT_MULTIPLIER: 0.35,
    ALPHA: 0.7,
};

/**
 * @class ItemDetailView
 * @description
 * Отображает подробную информацию о выбранном предмете.
 * Для кораблей и Эхо (пилотов) скрывает иконку и показывает только StatsDisplay.
 */
export class ItemDetailView extends Phaser.GameObjects.Container {
    constructor(scene, width = 280) {
        super(scene, 0, 0);
        this.contentWidth = width;
        this.calculatedHeight = 0;
        this._createBaseUI();
    }

    _createBaseUI() {
        this.projectionDisc = this.scene.add.image(0, 0, GLOW_EFFECT.TEXTURE_KEY);
        this.itemIcon = this.scene.add.image(this.contentWidth / 2, 0, 'default_module');
        this.statsDisplay = new StatsDisplay(this.scene, this.contentWidth);
        this.add([this.projectionDisc, this.itemIcon, this.statsDisplay]);
    }

    setItem(itemData) {
        if (!itemData) {
            this.setVisible(false);
            this.calculatedHeight = 0;
            return;
        }
        this.setVisible(true);

        const isShip = itemData.shipId !== undefined || itemData.category === 'ships';
        const isEcho = itemData.category === 'pilots';

        const shouldHideIcon = isShip || isEcho;

        this.itemIcon.setVisible(!shouldHideIcon);
        this.projectionDisc.setVisible(!shouldHideIcon);

        const rarityColorHex = RARITY_COLORS[itemData.rarity?.toLowerCase()] || RARITY_COLORS.default;
        const rarityColorString = `#${rarityColorHex.toString(16).padStart(6, '0')}`;

        if (!shouldHideIcon) {
            const keyForTexture = itemData.textureKey || itemData.key || itemData.type;
            const {textureKey, scale} = selectTextureAndScale(this.scene, keyForTexture, LAYOUT_CONFIG.ICON_SIZE);

            this.itemIcon.setTexture(textureKey).setScale(scale).setOrigin(0.5);
            this.itemIcon.setPosition(this.contentWidth / 2, LAYOUT_CONFIG.ICON_SIZE / 2);

            if (this.itemIcon.postFX) {
                this.itemIcon.postFX.clear();
                this.itemIcon.postFX.addGlow(rarityColorHex, 1.5, 0, false, 0.1, 15);
            }

            this.projectionDisc
                .setPosition(this.contentWidth / 2, LAYOUT_CONFIG.ICON_SIZE)
                .setDisplaySize(
                    LAYOUT_CONFIG.ICON_SIZE * GLOW_EFFECT.WIDTH_MULTIPLIER,
                    LAYOUT_CONFIG.ICON_SIZE * GLOW_EFFECT.HEIGHT_MULTIPLIER
                )
                .setTint(rarityColorHex)
                .setAlpha(GLOW_EFFECT.ALPHA);
        }

        const statsY = shouldHideIcon ? 0 : LAYOUT_CONFIG.ICON_SIZE + LAYOUT_CONFIG.ICON_TO_STATS_Y_GAP;
        this.statsDisplay.setPosition(0, statsY);

        const statsHeight = this.statsDisplay.update(itemData, rarityColorString);
        this.calculatedHeight = statsY + statsHeight;
    }
}