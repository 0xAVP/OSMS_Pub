import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../../core/utils.js';
import {RARITY_COLORS} from '../../../constants.js';

const DEFAULTS = {
    width: 320,
    height: 70,
    rarity: 'default',
    iconKey: 'default_module',
    name: 'Unnamed Module',
    level: 1,
    bgColors: {
        idle: 0x333333,
        hover: 0x555555,
        selected: 0x00A5FF
    },
    bgAlpha: {
        idle: 0.5,
        hover: 0.7,
        selected: 0.5
    }
};

export class ShipModuleItem extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, finalConfig.x, finalConfig.y);
        this.config = finalConfig;

        this._createUI();
        this._attachEventListeners();
        this.setState('idle');
    }

    _createUI() {
        const {width, height} = this.config;

        this.bgIdle = this.scene.add.graphics().fillStyle(DEFAULTS.bgColors.idle, DEFAULTS.bgAlpha.idle).fillRoundedRect(0, 0, width, height, 8);
        this.bgHover = this.scene.add.graphics().fillStyle(DEFAULTS.bgColors.hover, DEFAULTS.bgAlpha.hover).fillRoundedRect(0, 0, width, height, 8).setVisible(false);
        this.bgSelected = this.scene.add.graphics().fillStyle(DEFAULTS.bgColors.selected, DEFAULTS.bgAlpha.selected).fillRoundedRect(0, 0, width, height, 8).setVisible(false);

        this.rarityStripe = this.scene.add.graphics();

        this.iconBackground = this.scene.add.graphics();

        const circleRadius = (height * 0.9) / 2;
        const iconContainerX = 10 + circleRadius;
        const iconContainerY = height / 2;

        this.moduleIcon = this.scene.add.image(iconContainerX, iconContainerY, this.config.iconKey);

        const textStartX = iconContainerX + circleRadius + 15;
        this.nameText = this.scene.add.text(textStartX, height / 2 - 10, this.config.name, {
            fontFamily: 'Tektur',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        this.levelText = this.scene.add.text(textStartX, height / 2 + 12, `Level: ${this.config.level}`, {
            fontFamily: 'Tektur',
            fontSize: '14px',
            color: '#cccccc'
        }).setOrigin(0, 0.5);

        this.add([
            this.bgIdle,
            this.bgHover,
            this.bgSelected,
            this.rarityStripe,

            this.iconBackground,

            this.moduleIcon,
            this.nameText,
            this.levelText
        ]);

        this.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, width, height),
            Phaser.Geom.Rectangle.Contains
        );
        this.input.cursor = 'pointer';

        this.update(this.config);
    }

    _attachEventListeners() {
        this.on('pointerdown', () => {
            this.emit('click');
        });

        this.on('pointerover', () => {
            if (this.currentState !== 'selected') {
                this.setState('hover');
            }
        });

        this.on('pointerout', () => {
            if (this.currentState !== 'selected') {
                this.setState('idle');
            }
        });
    }

    update(newConfig) {
        this.config = {...this.config, ...newConfig};
        const {name, level, rarity, iconKey, height} = this.config;

        this.nameText.setText(name);
        this.levelText.setText(`Level: ${level}`);

        const bgSize = height * 0.9;
        const radius = bgSize / 2;
        const iconContainerX = 10 + radius;
        const iconContainerY = height / 2;

        const {textureKey, scale} = selectTextureAndScale(this.scene, iconKey, bgSize * 0.7);
        this.moduleIcon.setTexture(textureKey).setScale(scale).setPosition(iconContainerX, iconContainerY);

        const rarityColor = RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.default;
        const isModuleEquipped = rarity.toLowerCase() !== 'default' && name.toLowerCase().indexOf('empty') === -1;

        this.rarityStripe.clear();
        this.iconBackground.clear();

        if (isModuleEquipped) {

            this.rarityStripe.fillStyle(rarityColor, 1.0).fillRect(0, 0, 5, height);

            this.iconBackground.fillStyle(0x000000, 0.3)
                .lineStyle(2, rarityColor, 0.8)
                .fillCircle(iconContainerX, iconContainerY, radius)
                .strokeCircle(iconContainerX, iconContainerY, radius);

            this.moduleIcon.clearTint();
        } else {

            this.iconBackground.fillStyle(0x000000, 0.3)
                .lineStyle(1.5, 0x41C6FF, 0.3)
                .fillCircle(iconContainerX, iconContainerY, radius)
                .strokeCircle(iconContainerX, iconContainerY, radius);

            this.moduleIcon.setTint(0x41C6FF);
        }

    }

    setState(state) {
        if (this.currentState === state) return;

        this.currentState = state;
        this.bgIdle.setVisible(state === 'idle');
        this.bgHover.setVisible(state === 'hover');
        this.bgSelected.setVisible(state === 'selected');
    }
}