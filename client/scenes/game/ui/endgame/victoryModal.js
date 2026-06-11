import Phaser from 'phaser';
import {BaseVerticalModal} from './BaseVerticalModal';
import LootIdManager from '../../objects/loot/lootIdManager';
import {createLootGrid} from './lootGrid';

export class VictoryModal extends BaseVerticalModal {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        super(scene, 600);
        this.accentColor = 0xFFD700;
        this._createBackground(this.accentColor);
        this._createReturnButton();
    }

    /**
     * @param {Array} lootData - Массив вида [[id, amount], ...]
     */
    show(lootData) {
        this._createContent(lootData);
        super.show();
    }

    /**
     * @param {Array} lootData
     * @private
     */
    _createContent(lootData) {
        let currentY = -this.height / 2 + this.scale(70);

        const title = this.scene.add.text(0, currentY, 'COMPLETE', {
            fontFamily: 'Orbitron', fontSize: `${this.scale(72)}px`, color: '#FFD700',
            align: 'center', stroke: '#000000', strokeThickness: this.scale(4)
        }).setOrigin(0.5);
        this.contentContainer.add(title);

        currentY += title.height / 2 + this.scale(50);

        const subtitle = this.scene.add.text(0, currentY, 'MISSION REWARDS', {
            fontFamily: 'Tektur', fontSize: `${this.scale(24)}px`, color: '#FFFFFF'
        }).setOrigin(0.5);
        this.contentContainer.add(subtitle);

        currentY += subtitle.height / 2 + this.scale(40);

        if (lootData && Array.isArray(lootData) && lootData.length > 0) {
            const allItems = lootData.map(item => {
                const [id, amount] = item;
                const itemData = LootIdManager.getItemData(id);
                return itemData ? {...itemData, amount} : null;
            }).filter(Boolean);

            if (allItems.length > 0) {

                const lootGridContainer = createLootGrid(this.scene, allItems);
                lootGridContainer.y = currentY;
                this.contentContainer.add(lootGridContainer);
            }
        } else {
            const noRewardsText = this.scene.add.text(0, currentY + this.scale(50), 'No rewards for this mission.', {
                fontFamily: 'Tektur', fontSize: `${this.scale(20)}px`, color: '#aaaaaa', align: 'center'
            }).setOrigin(0.5);
            this.contentContainer.add(noRewardsText);
        }
    }
}
