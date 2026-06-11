import Phaser from 'phaser';
import {ActionButton} from '../../../components/ActionButton.js';
import {selectTextureAndScale} from '../../../../../core/utils.js';
import {getCatalogData} from '../../../../wallet/catalog.js';

const STYLES = {
    resourceTitle: {fontFamily: 'Tektur', fontSize: '18px', color: '#41C6FF', fontStyle: 'bold'},
    resourceName: {fontFamily: 'Tektur', fontSize: '16px', color: '#e0e0e0'},
    resourceQuantity: {fontFamily: 'Tektur', fontSize: '14px', color: '#a0a0a0'},
};

const LAYOUT = {
    RESOURCE_ROW_HEIGHT: 75,
    ACTION_AREA_Y: 450,
    ACTION_AREA_OFFSET_X: -20,
    BUTTON_Y: 60,
};

export class DismantleActionView extends Phaser.GameObjects.Container {
    constructor(scene, config = {}) {
        super(scene, config.x || 0, config.y || 0);

        this.itemData = null;
        this.ui = {};
        this._createUI(config);

        this.ui.actionButton.on('click', () => this.emit('dismantle-click', this.itemData));

        this.setVisible(false);
        scene.add.existing(this);
    }

    _createUI(config) {
        const contentWidth = config.width || 350;
        const centerX = contentWidth / 2;
        const adjustedCenterX = centerX + LAYOUT.ACTION_AREA_OFFSET_X;
        const actionAreaY = LAYOUT.ACTION_AREA_Y;

        this.ui.resourcesLabel = this.scene.add.text(0, 0, 'RESOURCES OBTAINED:', STYLES.resourceTitle).setOrigin(0);
        this.ui.resourcesContainer = this.scene.add.container(0, 45);

        this.ui.actionButton = new ActionButton(this.scene, {
            x: adjustedCenterX,
            y: actionAreaY + LAYOUT.BUTTON_Y,
            texture: 'dismantle',
            scale: 0.8,
            cooldown: 2000
        });

        this.add([
            this.ui.resourcesLabel, this.ui.resourcesContainer,
            this.ui.actionButton
        ]);
    }

    setItem(moduleData) {
        this.itemData = moduleData;
        if (!moduleData) {
            this.setVisible(false);
            return;
        }

        this.setVisible(true);
        this._updateResources();
    }

    _updateResources() {
        if (!this.itemData) return;
        this.ui.resourcesContainer.removeAll(true);

        const dismantleData = getCatalogData(this.scene, this.itemData.key, "modules")?.dismantle || {};
        const receivedResources = Object.entries(dismantleData);

        if (receivedResources.length === 0) {
            this.ui.resourcesLabel.setText('Nothing will be received.');
            return;
        }
        this.ui.resourcesLabel.setText('RESOURCES OBTAINED:');

        let currentY = 0;

        receivedResources.forEach(([resKey, resData]) => {
            const resourceCatalogData = getCatalogData(this.scene, resKey, resData.category);
            const resourceName = resourceCatalogData.name || resKey;
            const receivedAmount = resData.quantity;

            const resRow = this.scene.add.container(0, currentY);

            const iconBgSize = 64;
            const iconX = 35;
            const iconY = LAYOUT.RESOURCE_ROW_HEIGHT / 2;

            const resIconBg = this.scene.add.graphics().fillStyle(0x333333, 0.7).fillRoundedRect(iconX - iconBgSize / 2, iconY - iconBgSize / 2, iconBgSize, iconBgSize, 8);
            const {textureKey, scale} = selectTextureAndScale(this.scene, resKey, 50);
            const resIcon = this.scene.add.image(iconX, iconY, textureKey).setScale(scale);

            const textBlockX = iconX + (iconBgSize / 2) + 20;
            const rowCenterY = LAYOUT.RESOURCE_ROW_HEIGHT / 2;
            const textGap = 4;

            const resNameText = this.scene.add.text(textBlockX, rowCenterY - textGap, resourceName, STYLES.resourceName).setOrigin(0, 1);
            const resQuantityText = this.scene.add.text(textBlockX, rowCenterY + textGap, `x${receivedAmount}`, STYLES.resourceQuantity).setOrigin(0, 0);

            resRow.add([resIconBg, resIcon, resNameText, resQuantityText]);
            this.ui.resourcesContainer.add(resRow);

            currentY += LAYOUT.RESOURCE_ROW_HEIGHT;
        });

    }
}
