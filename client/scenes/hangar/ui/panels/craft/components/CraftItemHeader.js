import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../../../core/utils.js';
import {RARITY_COLORS} from '../../../../constants.js';
import {drawParameters} from '../../inventory/components/statsFormatters.js';
import {getCatalogData} from '../../../../wallet/catalog.js';

const STYLES = {
    title: {fontFamily: 'Tektur', fontSize: '20px', color: '#ffffff'},
    rarity: {fontFamily: 'Tektur', fontSize: '14px'},
    craftTime: {fontFamily: 'Tektur', fontSize: '14px', color: '#c2d1e5'},
    description: {fontFamily: 'Tektur', fontSize: '14px', color: '#a0a0a0', fontStyle: 'italic'},
    obtainedHeader: {fontFamily: 'Tektur', fontSize: '18px', color: '#41C6FF', fontStyle: 'bold'},
    obtainedItem: {fontFamily: 'Tektur', fontSize: '16px', color: '#e0e0e0'},
};

const LAYOUT = {
    ICON_SIZE: 120,
    ICON_TO_TITLE_GAP: 45,
    TITLE_TO_RARITY_GAP: 5,
    RARITY_TO_TIME_GAP: 15,
    TIME_TO_DESC_GAP: 10,
    CLOCK_ICON_SIZE: 18
};

function formatCraftTime(totalSeconds) {
    if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) return '';
    if (totalSeconds === 0) return 'Instant';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
}

export class CraftItemHeader extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width) {
        super(scene, x, y);
        this.contentWidth = width;
        this.baseCraftQuantity = 0;
        this.craftedItemName = '';

        const centerX = this.contentWidth / 2;
        this.projectionDisc = this.scene.add.image(centerX, LAYOUT.ICON_SIZE / 2 + 20, 'projection_disc_glow').setAlpha(0.7);
        this.itemIcon = this.scene.add.image(centerX, LAYOUT.ICON_SIZE / 2, 'default_module');
        this.titleText = this.scene.add.text(centerX, 0, '', STYLES.title).setOrigin(0.5);
        this.rarityText = this.scene.add.text(centerX, 0, '', STYLES.rarity).setOrigin(0.5);
        const {
            textureKey: clockTextureKey,
            scale: clockScale
        } = selectTextureAndScale(this.scene, 'ic_time', LAYOUT.CLOCK_ICON_SIZE);
        this.clockIcon = this.scene.add.image(0, 0, clockTextureKey).setScale(clockScale);
        this.craftTimeText = this.scene.add.text(0, 0, '', STYLES.craftTime).setOrigin(0, 0.5);
        this.descriptionText = this.scene.add.text(centerX, 0, '', {
            ...STYLES.description,
            wordWrap: {width: this.contentWidth - 20},
            align: 'left'
        }).setOrigin(0.5, 0);
        this.statsContainer = this.scene.add.container(0, 0);
        this.obtainedContainer = this.scene.add.container(0, 0);
        this.obtainedHeader = this.scene.add.text(0, 0, 'ITEMS OBTAINED:', STYLES.obtainedHeader).setOrigin(0);
        this.obtainedItemText = this.scene.add.text(20, 30, '', STYLES.obtainedItem).setOrigin(0);
        this.obtainedContainer.add([this.obtainedHeader, this.obtainedItemText]);

        this.add([
            this.projectionDisc, this.itemIcon, this.titleText, this.rarityText,
            this.clockIcon, this.craftTimeText, this.descriptionText,
            this.statsContainer, this.obtainedContainer
        ]);
        scene.add.existing(this);
    }

    update(itemData) {
        this.titleText.setText(itemData.name || 'Unknown Item');
        const {textureKey, scale} = selectTextureAndScale(this.scene, itemData.key, LAYOUT.ICON_SIZE);
        this.itemIcon.setTexture(textureKey).setScale(scale);
        const rarity = itemData.rarity?.toLowerCase() || 'default';
        const rarityColor = RARITY_COLORS[rarity];
        this.rarityText.setText(`Rarity: ${rarity}`).setColor(`#${rarityColor.toString(16)}`);

        this.baseCraftTime = itemData.timetocraft;

        let currentY = LAYOUT.ICON_SIZE + LAYOUT.ICON_TO_TITLE_GAP;
        this.titleText.setY(currentY);

        currentY += this.titleText.height + LAYOUT.TITLE_TO_RARITY_GAP;
        this.rarityText.setY(currentY);

        if (this.baseCraftTime !== undefined) {
            currentY += this.rarityText.height + LAYOUT.RARITY_TO_TIME_GAP;
            this.clockIcon.setY(currentY);
            this.craftTimeText.setY(currentY);
            this.updateCraftTime(1);
            currentY += this.craftTimeText.height + LAYOUT.TIME_TO_DESC_GAP;
        } else {
            this.clockIcon.setVisible(false);
            this.craftTimeText.setVisible(false);
            currentY += this.rarityText.height + LAYOUT.RARITY_TO_TIME_GAP;
        }

        const description = itemData.description || '';
        this.descriptionText.setText(description);
        if (description) {
            this.descriptionText.setY(currentY).setVisible(true);
            currentY += this.descriptionText.height;
        } else {
            this.descriptionText.setVisible(false);
        }

        this.statsContainer.removeAll(true);
        const originalBlueprint = itemData.originalBlueprint;
        const isModuleBlueprint = originalBlueprint && originalBlueprint.itemCrafted && Object.values(originalBlueprint.itemCrafted)[0]?.category === 'modules';

        if (isModuleBlueprint) {
            const statsY = currentY + 20;
            this.statsContainer.setPosition(0, statsY);

            const enrichedBlueprintData = JSON.parse(JSON.stringify(originalBlueprint));
            const itemCraftedKey = Object.keys(enrichedBlueprintData.itemCrafted)[0];
            const meta = enrichedBlueprintData.itemCrafted[itemCraftedKey];
            const fullCraftedInfo = getCatalogData(this.scene, itemCraftedKey, meta.category);
            enrichedBlueprintData.itemCrafted[itemCraftedKey] = {...meta, ...fullCraftedInfo};

            const statsResult = drawParameters(this.statsContainer, enrichedBlueprintData, 0);

            this.statsContainer.setVisible(true);

            currentY = statsY + statsResult.height;
        } else {
            this.statsContainer.setVisible(false);
        }

        if (originalBlueprint && originalBlueprint.itemCrafted) {
            const obtainedY = currentY + 25;
            this.obtainedContainer.setPosition(0, obtainedY);

            const itemCraftedKey = Object.keys(originalBlueprint.itemCrafted)[0];
            const itemCraftedMeta = originalBlueprint.itemCrafted[itemCraftedKey];
            const craftedItemInfo = getCatalogData(this.scene, itemCraftedKey, itemCraftedMeta.category);

            this.craftedItemName = craftedItemInfo.name || itemCraftedKey;
            this.baseCraftQuantity = itemCraftedMeta.quantity || 1;

            this.updateObtainedQuantity(1);
            this.obtainedContainer.setVisible(true);
        } else {
            this.obtainedContainer.setVisible(false);
        }

        this.projectionDisc.setDisplaySize(LAYOUT.ICON_SIZE * 1.25, LAYOUT.ICON_SIZE * 0.35).setTint(rarityColor);
        if (this.itemIcon.postFX) {
            this.itemIcon.postFX.clear();
            this.itemIcon.postFX.addGlow(rarityColor, 1.5, 0, false, 0.1, 15);
        }
    }

    updateObtainedQuantity(quantity) {
        if (!this.craftedItemName || this.baseCraftQuantity <= 0) {
            this.obtainedItemText.setText('');
            return;
        }
        const totalQuantity = this.baseCraftQuantity * quantity;
        this.obtainedItemText.setText(`• ${this.craftedItemName} x${totalQuantity}`);
    }

    updateCraftTime(quantity) {
        if (this.baseCraftTime === undefined || this.baseCraftTime === null) {
            this.clockIcon.setVisible(false);
            this.craftTimeText.setVisible(false);
            return;
        }
        const totalSeconds = this.baseCraftTime * quantity;
        const timeString = formatCraftTime(totalSeconds);
        this.craftTimeText.setText(timeString);
        const totalTimeWidth = this.clockIcon.displayWidth + 8 + this.craftTimeText.width;
        const timeStartX = (this.contentWidth - totalTimeWidth) / 2;
        this.clockIcon.setX(timeStartX + this.clockIcon.displayWidth / 2);
        this.craftTimeText.setX(timeStartX + this.clockIcon.displayWidth + 8);
        this.clockIcon.setVisible(true);
        this.craftTimeText.setVisible(true);
    }
}