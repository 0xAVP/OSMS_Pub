import Phaser from 'phaser';
import {QuantityInput} from '../../../components/qinput';
import {ActionButton} from '../../../components/ActionButton.js';
import {findInventoryItem, calculateUpgradeRequiredResources, calculateMaxUpgradeAmount} from '../../../actionUtils.js';
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
    INPUT_TO_BUTTON_Y_GAP: 60,
};

export class UpgradeActionView extends Phaser.GameObjects.Container {
    constructor(scene, config = {}) {
        super(scene, config.x || 0, config.y || 0);

        this.itemData = null;
        this.isActionPossible = false;
        this.ui = {};
        this._createUI(config);

        this.ui.quantityInput.on('change', (quantity) => this._updateResources(quantity));
        this.ui.actionButton.on('click', () => this._handleAction());

        this.setVisible(false);
        scene.add.existing(this);
    }

    _createUI(config) {
        const contentWidth = config.width || 350;
        const centerX = contentWidth / 2;
        const adjustedCenterX = centerX + LAYOUT.ACTION_AREA_OFFSET_X;
        const buttonY = LAYOUT.ACTION_AREA_Y + LAYOUT.INPUT_TO_BUTTON_Y_GAP;

        this.ui.resourcesLabel = this.scene.add.text(0, 0, 'UPGRADE COST:', STYLES.resourceTitle).setOrigin(0);
        this.ui.resourcesContainer = this.scene.add.container(0, 45);
        this.ui.quantityInput = new QuantityInput(this.scene, adjustedCenterX, LAYOUT.ACTION_AREA_Y, {
            width: 120,
            showMaxButton: true
        });
        this.ui.actionButton = new ActionButton(this.scene, {
            x: adjustedCenterX,
            y: buttonY,
            texture: 'upgrade',
            scale: 0.8,
            cooldown: 2000
        });

        this.add([
            this.ui.resourcesLabel, this.ui.resourcesContainer,
            this.ui.quantityInput, this.ui.actionButton
        ]);
    }

    setItem(moduleData) {
        this.itemData = moduleData;
        if (!moduleData) {
            this.setVisible(false);
            return;
        }

        this.setVisible(true);
        const maxAmount = calculateMaxUpgradeAmount(this.scene, moduleData);
        this.ui.quantityInput.setDynamicMax(maxAmount);
        this.ui.quantityInput.setValue(1, true);
        this._updateResources(1);
    }

    _updateResources(quantity) {
        if (!this.itemData) return;
        this.ui.resourcesContainer.removeAll(true);

        const finalRequiredResources = calculateUpgradeRequiredResources(this.scene, this.itemData, quantity);
        const resourcesToDisplay = Object.entries(finalRequiredResources);
        let hasEnoughResources = true;
        let currentY = 0;

        resourcesToDisplay.forEach(([resKey, resData]) => {
            const requiredAmount = resData.quantity;
            const availableAmount = findInventoryItem(this.scene, this.scene.inventoryItems, resKey);
            if (availableAmount < requiredAmount) hasEnoughResources = false;

            const resourceCatalogData = getCatalogData(this.scene, resKey, resData.category);
            const resourceName = resourceCatalogData.name || resKey;

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
            const resQuantityText = this.scene.add.text(textBlockX, rowCenterY + textGap, `${availableAmount} / ${requiredAmount}`, STYLES.resourceQuantity).setOrigin(0, 0);

            if (availableAmount < requiredAmount) resQuantityText.setColor('#ff6b6b');

            resRow.add([resIconBg, resIcon, resNameText, resQuantityText]);
            this.ui.resourcesContainer.add(resRow);
            currentY += LAYOUT.RESOURCE_ROW_HEIGHT;
        });

        this.isActionPossible = hasEnoughResources;
        this.ui.actionButton.enableState(this.isActionPossible);
    }

    _handleAction() {
        if (!this.itemData || !this.isActionPossible) return;
        const quantity = this.ui.quantityInput.getValue();
        this.emit('upgrade-click', {moduleData: this.itemData, quantity: quantity});
    }
}
