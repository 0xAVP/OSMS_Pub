import Phaser from 'phaser';
import {findInventoryItem} from '../../../actionUtils.js';
import {getCatalogData} from '../../../../wallet/catalog.js';
import {selectTextureAndScale} from '../../../../../core/utils.js';

const STYLES = {

    label: {fontFamily: 'Tektur', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'},
    resourceTitle: {fontFamily: 'Tektur', fontSize: '18px', color: '#41C6FF', fontStyle: 'bold'},
    resourceName: {fontFamily: 'Tektur', fontSize: '16px', color: '#e0e0e0'},
    resourceQuantity: {fontFamily: 'Tektur', fontSize: '14px', color: '#a0a0a0'}
}

const LAYOUT = {
    RESOURCE_ROW_HEIGHT: 75,
};

export class CraftResourceList extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width) {
        super(scene, x, y);
        this.contentWidth = width;

        this.resourcesLabel = this.scene.add.text(0, 0, 'REQUIRED RESOURCES:', STYLES.resourceTitle).setOrigin(0);
        this.resourcesContainer = this.scene.add.container(0, 45);

        this.add([this.resourcesLabel, this.resourcesContainer]);
        scene.add.existing(this);
    }

    update(scene, itemData, quantity) {
        this.resourcesContainer.removeAll(true);
        if (!itemData) return false;

        const baseResources = itemData.requiredResources || {};
        let hasEnoughResources = true;
        let currentY = 0;

        for (const resKey in baseResources) {

            const requiredAmount = (baseResources[resKey].quantity || 0) * quantity;
            const availableAmount = findInventoryItem(scene, scene.inventoryItems, resKey);
            const resourceInfo = getCatalogData(scene, resKey, baseResources[resKey].category);
            if (availableAmount < requiredAmount) hasEnoughResources = false;

            const resRow = scene.add.container(0, currentY);

            const iconBgSize = 64;
            const iconX = 35;
            const iconY = LAYOUT.RESOURCE_ROW_HEIGHT / 2;

            const resIconBg = scene.add.graphics();
            resIconBg.fillStyle(0x333333, 0.7);
            resIconBg.fillRoundedRect(iconX - iconBgSize / 2, iconY - iconBgSize / 2, iconBgSize, iconBgSize, 8);

            const {textureKey, scale} = selectTextureAndScale(scene, resKey, 50);
            const resIcon = scene.add.image(iconX, iconY, textureKey).setScale(scale);

            const textBlockX = iconX + (iconBgSize / 2) + 20;

            const rowCenterY = LAYOUT.RESOURCE_ROW_HEIGHT / 2;
            const textGap = 4;
            const nameY = rowCenterY - textGap;
            const resName = scene.add.text(textBlockX, nameY, resourceInfo.name, STYLES.resourceName).setOrigin(0, 1);
            const quantityY = rowCenterY + textGap;
            const resQuantity = scene.add.text(textBlockX, quantityY, `${availableAmount} / ${requiredAmount}`, STYLES.resourceQuantity).setOrigin(0, 0);
            if (availableAmount < requiredAmount) resQuantity.setColor('#ff6b6b');

            resRow.add([resIconBg, resIcon, resName, resQuantity]);
            this.resourcesContainer.add(resRow);

            currentY += LAYOUT.RESOURCE_ROW_HEIGHT;
        }

        return hasEnoughResources;
    }
}