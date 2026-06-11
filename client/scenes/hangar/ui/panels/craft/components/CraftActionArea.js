import Phaser from 'phaser';
import {QuantityInput} from '../../../components/qinput';
import {ActionButton} from '../../../components/ActionButton.js';
import {findInventoryItem} from '../../../actionUtils.js';

export class CraftActionArea extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width) {
        super(scene, x, y);
        this.contentWidth = width;

        const centerX = this.contentWidth / 2;
        const VISUAL_CENTER_OFFSET_X = -20;
        const pos = centerX + VISUAL_CENTER_OFFSET_X;

        this.quantityInput = new QuantityInput(scene, pos, 0, {width: 120, showMaxButton: true});

        this.actionButton = new ActionButton(scene, {
            x: pos,
            y: 60,
            texture: 'craft',
            scale: 0.8,
            cooldown: 2000
        });

        this.add([this.quantityInput, this.actionButton]);

        this.quantityInput.on('change', (quantity) => this.emit('quantity-changed', quantity));

        this.actionButton.on('click', () => this.emit('action-click', this.quantityInput.getValue()));

        scene.add.existing(this);
    }

    update(scene, itemData) {
        const maxAmount = this._calculateMaxCraftAmount(scene, itemData);
        this.quantityInput.setDynamicMax(maxAmount);
        this.quantityInput.setValue(1, false);
    }

    setButtonState(isEnabled) {
        this.actionButton.enableState(isEnabled);
    }

    _calculateMaxCraftAmount(scene, itemData) {
        if (!itemData || !itemData.requiredResources) return 999;
        let maxAmount = Infinity;
        for (const resKey in itemData.requiredResources) {
            const resData = itemData.requiredResources[resKey];
            if (!resData.quantity || resData.quantity <= 0) continue;
            const availableAmount = findInventoryItem(scene, scene.inventoryItems, resKey);
            const possibleAmount = Math.floor(availableAmount / resData.quantity);
            if (possibleAmount < maxAmount) {
                maxAmount = possibleAmount;
            }
        }
        return maxAmount === Infinity ? 999 : maxAmount;
    }
}