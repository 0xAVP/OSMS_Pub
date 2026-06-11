import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../core/utils.js';
import {RARITY_COLORS} from '../../constants.js';

const DEFAULTS = {
    width: 280,
    height: 50,
    rarity: 'default',
    iconKey: null,
    label: 'Unnamed Item',
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

/**
 * @class ListItem
 * @extends Phaser.GameObjects.Container
 * @description Инкапсулированный компонент для отображения элемента в ScrollableList.
 * Управляет собственными визуальными состояниями (idle, hover, selected).
 */
export class ListItem extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, 0, 0);
        this.config = finalConfig;
        this.currentState = 'idle';

        this._createUI();
        this.setState('idle');
    }

    _createUI() {
        const {width, height, rarity, iconKey, label, bgColors, bgAlpha} = this.config;

        this.bgIdle = this.scene.add.graphics().fillStyle(bgColors.idle, bgAlpha.idle).fillRoundedRect(0, 0, width, height, 8);
        this.bgHover = this.scene.add.graphics().fillStyle(bgColors.hover, bgAlpha.hover).fillRoundedRect(0, 0, width, height, 8);
        this.bgSelected = this.scene.add.graphics().fillStyle(bgColors.selected, bgAlpha.selected).fillRoundedRect(0, 0, width, height, 8);

        const rarityColor = RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.default;
        const rarityStripe = this.scene.add.graphics().fillStyle(rarityColor, 1).fillRect(0, 0, 5, height);

        const iconTargetHeight = height * 0.7;

        const {textureKey} = selectTextureAndScale(this.scene, iconKey, iconTargetHeight);

        const icon = this.scene.add.image(35, height / 2, textureKey);

        const sourceTexture = this.scene.textures.get(textureKey);
        if (sourceTexture.key !== '__MISSING') {
            const sourceWidth = sourceTexture.source[0].width;
            const sourceHeight = sourceTexture.source[0].height;
            const aspectRatio = sourceWidth / sourceHeight;

            icon.setDisplaySize(iconTargetHeight * aspectRatio, iconTargetHeight);
        }

        const title = this.scene.add.text(70, height / 2, label, {
            fontFamily: 'Tektur',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.add([this.bgIdle, this.bgHover, this.bgSelected, rarityStripe, icon, title]);

        this.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, width, height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });
    }

    /**
     * Устанавливает визуальное состояние элемента.
     * @param {'idle' | 'hover' | 'selected'} state - Новое состояние.
     */
    setState(state) {
        this.currentState = state;
        this.bgIdle.setVisible(state === 'idle');
        this.bgHover.setVisible(state === 'hover');
        this.bgSelected.setVisible(state === 'selected');
    }
}