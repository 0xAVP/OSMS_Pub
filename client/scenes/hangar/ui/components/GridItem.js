import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../core/utils.js';
import {RARITY_COLORS} from '../../constants.js';

const DEFAULTS = {
    width: 100,
    height: 120,
    rarity: 'default',
    iconKey: null,
    labelText: '',
    tooltipData: {},
};

export class GridItem extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, 0, 0);
        this.config = finalConfig;

        this._createUI();
        this._attachEventListeners();
        this.setState('idle');
    }

    _createUI() {
        const {width, height, rarity, iconKey, labelText, tier} = this.config;
        this.bgIdle = this.scene.add.image(0, 0, 'empty_card_item').setDisplaySize(width, height);
        this.bgHover = this.scene.add.image(0, 0, 'card_item').setDisplaySize(width, height).setVisible(false);
        this.bgSelected = this.scene.add.image(0, 0, 'card_item').setDisplaySize(width, height).setVisible(false);
        let baseTextureKey = iconKey;
        if (baseTextureKey && baseTextureKey.startsWith('stagestone_tier_')) {
            baseTextureKey = 'stagestone_texture';
        }
        const {textureKey, scale} = selectTextureAndScale(this.scene, baseTextureKey, width * 0.8);
        const icon = this.scene.add.image(0, -10, textureKey).setScale(scale);
        const infoText = this.scene.add.text(0, 45, labelText, {
            fontFamily: 'Tektur', fontSize: '14px', color: '#ffffff'
        }).setOrigin(0.5);

        this.add([this.bgIdle, this.bgHover, this.bgSelected, icon, infoText]);

        if (tier) {
            const tierText = this.scene.add.text(0, -10, tier.toString(), {
                fontFamily: 'Tektur',
                fontSize: '28px',
                color: '#ffffff',

            }).setOrigin(0.5);

            tierText.setShadow(2, 2, '#000000', 5, true, true);

            this.add(tierText);
        }

        this.setSize(width, height).setInteractive({useHandCursor: true});
    }

    _attachEventListeners() {
        this.on('pointerover', (pointer) => {

            if (this.scene.tooltip) {
                this.scene.tooltip.show(pointer.x, pointer.y, this.config.tooltipData);
            }
        });

        this.on('pointerout', () => {
            if (this.scene.tooltip) {
                this.scene.tooltip.hide();
            }
        });
    }

    setState(state) {
        this.currentState = state;
        this.bgIdle.setVisible(state === 'idle');
        this.bgHover.setVisible(state === 'hover');
        this.bgSelected.setVisible(state === 'selected');
    }
}