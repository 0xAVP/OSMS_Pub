import Phaser from 'phaser';
import {RARITY_COLORS} from '../../../../constants.js';
import {SHIP_LORE_DATA} from "./shipsData";
import {ActionButton} from '../../../components/ActionButton.js';
import {findInventoryItem} from "../../../actionUtils";
import {getCatalogData} from "../../../../wallet/catalog";

const STYLES = {
    HEADER: {fontFamily: 'Tektur', fontSize: '24px', color: '#41C6FF'},
    CLASS: {fontFamily: 'Tektur', fontSize: '28px', color: '#FFFFFF'},
    RARITY: {fontFamily: 'Tektur', fontSize: '18px'},
    DESCRIPTION: {fontFamily: 'Tektur', fontSize: '16px', color: '#a0a0a0', wordWrap: {width: 400}, lineSpacing: 5},
    COST_HEADER: {fontFamily: 'Tektur', fontSize: '18px', color: '#cccccc'},
    COST_TEXT: {fontFamily: 'Tektur', fontSize: '16px'},
};

export class ClassificationPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);

        this.currentShipData = null;
        this.isCurrentlyMinting = false;

        this._createUI();

        this.scene.events.on('inventory-updated', this._handleInventoryUpdate, this);

        this.on('destroy', () => {
            this.scene.events.off('inventory-updated', this._handleInventoryUpdate, this);
        });

    }

    /**
     * @private
     * Этот метод будет вызываться каждый раз, когда инвентарь в сцене обновляется.
     */
    _handleInventoryUpdate() {

        if (this.currentShipData) {
            console.log('ClassificationPanel detected inventory update. Re-rendering...');
            this.update(this.currentShipData, this.isCurrentlyMinting);
        }
    }

    _createUI() {
        let currentY = -250;
        const header = this.scene.add.text(0, currentY, 'CLASSIFICATION', STYLES.HEADER).setOrigin(0.5);
        currentY += header.height + 30;

        this.classText = this.scene.add.text(0, currentY, '', STYLES.CLASS).setOrigin(0.5);
        currentY += this.classText.height + 10;

        this.rarityText = this.scene.add.text(0, currentY, '', STYLES.RARITY).setOrigin(0.5);
        currentY += this.rarityText.height + 40;

        this.descriptionText = this.scene.add.text(0, currentY, '', STYLES.DESCRIPTION).setOrigin(0.5, 0);

        const MINT_BUTTON_Y = 240;
        this.costContainer = this.scene.add.container(0, 140);
        this.actionButton = new ActionButton(this.scene, {x: 0, y: MINT_BUTTON_Y, texture: 'mint', scale: 1});
        this.messageText = this.scene.add.text(0, MINT_BUTTON_Y, '', {
            ...STYLES.HEADER,
            color: '#ff9900'
        }).setOrigin(0.5).setVisible(false);
        this.actionButton.on('click', () => this.emit('mint-clicked'));

        this.add([header, this.classText, this.rarityText, this.descriptionText, this.costContainer, this.actionButton, this.messageText]);
    }

    _renderCraftRequirements(shipData) {
        this.costContainer.removeAll(true);
        const lore = SHIP_LORE_DATA[shipData.name] || {};
        const requirements = lore.craftingRequirements;

        if (!requirements) {
            const costText = this.scene.add.text(0, 0, shipData.mintStatus.displayPrice, STYLES.CLASS).setOrigin(0.5);
            this.costContainer.add(costText);
            return true;
        }

        const headerContainer = this.scene.add.container(0, 0);
        this.costContainer.add(headerContainer);

        const costHeader = this.scene.add.text(0, 0, 'Required to Craft:', STYLES.COST_HEADER).setOrigin(0.5);

        const helpIcon = this.scene.add.text(
            costHeader.width / 2 + 5,
            0,
            '(?)',
            {...STYLES.COST_HEADER, color: '#41C6FF'}
        ).setOrigin(0, 0.5).setInteractive({useHandCursor: true});

        const totalHeaderWidth = costHeader.width + helpIcon.width + 5;
        costHeader.x = -totalHeaderWidth / 2 + costHeader.width / 2;
        helpIcon.x = costHeader.x + costHeader.width / 2 + 5;

        headerContainer.add([costHeader, helpIcon]);

        const tooltipMessage = 'Resources are deducted immediately to reserve the minting slot.\n\nIf you reject the transaction or it fails, coins will be automatically returned withing ~1 hour via System Mail.';
        helpIcon.on('pointerover', (pointer) => {
            this.scene.tooltip.show(pointer.x, pointer.y, {
                name: 'Transaction Safety',
                description: tooltipMessage
            });
        });
        helpIcon.on('pointerout', () => {
            this.scene.tooltip.hide();
        });

        let currentY = costHeader.height + 10;
        let allResourcesAvailable = true;

        for (const [key, data] of Object.entries(requirements)) {
            const requiredAmount = data.quantity;
            const availableAmount = findInventoryItem(this.scene, this.scene.inventoryItems, key);
            const itemInfo = getCatalogData(this.scene, key, data.category);
            const hasEnough = availableAmount >= requiredAmount;
            if (!hasEnough) allResourcesAvailable = false;
            const color = hasEnough ? '#a0a0a0' : '#ff6b6b';
            const text = `${itemInfo.name}: ${availableAmount} / ${requiredAmount}`;
            const costLine = this.scene.add.text(0, currentY, text, {...STYLES.COST_TEXT, color: color}).setOrigin(0.5);
            this.costContainer.add(costLine);
            currentY += costLine.height + 5;
        }

        return allResourcesAvailable;
    }

    update(shipData, isMinting) {

        this.currentShipData = shipData;
        this.isCurrentlyMinting = isMinting;

        const lore = SHIP_LORE_DATA[shipData.name] || SHIP_LORE_DATA.default;
        const rarityColor = RARITY_COLORS[lore.rarity.toLowerCase()] || RARITY_COLORS.default;

        this.classText.setText(lore.class.toUpperCase());
        this.rarityText.setText(`Rarity: ${lore.rarity}`).setColor(`#${rarityColor.toString(16)}`);
        this.descriptionText.setText(lore.description);

        const status = shipData.mintStatus;
        this.actionButton.setVisible(false);
        this.costContainer.setVisible(false);
        this.messageText.setVisible(false);

        if (status.status === 'CRAFT_ONLY') {
            this.actionButton.setVisible(true);
            this.actionButton.buttonImage.setTexture('craft');
            this.costContainer.setVisible(true);
            const canAfford = this._renderCraftRequirements(shipData);
            this.actionButton.enableState(status.canAction && canAfford && !isMinting);
        } else {
            this.actionButton.buttonImage.setTexture('mint');
            this._renderCraftRequirements(shipData);
            switch (status.status) {
                case 'FREE':
                case 'MINTABLE':
                    this.actionButton.setVisible(true);
                    this.costContainer.setVisible(true);
                    break;
                default:
                    this.messageText.setVisible(true).setText(status.message);
                    break;
            }
            this.actionButton.enableState(status.canAction && !isMinting);
        }
    }
}