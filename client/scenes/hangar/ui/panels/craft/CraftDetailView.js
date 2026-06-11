import Phaser from 'phaser';
import {CraftItemHeader} from './components/CraftItemHeader.js';
import {CraftResourceList} from './components/CraftResourceList.js';
import {CraftActionArea} from './components/CraftActionArea.js';

import {TwoColumnLayout} from '../../layouts/TwoColumnLayout.js';

const LAYOUT_CONFIG = {
    leftColumnWidth: 230,
    rightColumnWidth: 350,
    columnGap: 40,
    height: 560,
};

export class CraftDetailView extends Phaser.GameObjects.Container {
    constructor(scene, config = {}) {
        super(scene, config.x || 0, config.y || 0);

        this.itemData = null;
        this.onAction = config.onAction || (() => console.warn('CraftDetailView: onAction callback is not defined!'));

        this._createUI();
        this._attachEventListeners();

        this.setVisible(false);
        scene.add.existing(this);
    }

    _createUI() {

        this.layout = new TwoColumnLayout(this.scene, LAYOUT_CONFIG);

        this.itemHeader = new CraftItemHeader(this.scene, 0, 0, LAYOUT_CONFIG.leftColumnWidth);

        this.resourceList = new CraftResourceList(this.scene, 0, 0, LAYOUT_CONFIG.rightColumnWidth);
        const actionAreaY = LAYOUT_CONFIG.height - 100;
        this.actionArea = new CraftActionArea(this.scene, 0, actionAreaY, LAYOUT_CONFIG.rightColumnWidth);

        this.layout.leftContainer.add(this.itemHeader);

        this.layout.rightContainer.add([this.resourceList, this.actionArea]);

        this.add(this.layout);
    }

    _attachEventListeners() {
        this.actionArea.on('quantity-changed', (quantity) => {
            const hasEnough = this.resourceList.update(this.scene, this.itemData, quantity);
            this.actionArea.setButtonState(hasEnough);
            this.itemHeader.updateCraftTime(quantity);
            this.itemHeader.updateObtainedQuantity(quantity);
        });

        this.actionArea.on('action-click', (quantity) => {
            this._handleAction(quantity);
        });
    }

    setItem(itemData) {
        this.itemData = itemData;
        if (!itemData) {
            this.setVisible(false);
            return;
        }

        this.itemHeader.update(itemData);
        this.actionArea.update(this.scene, itemData);

        this.setVisible(true);
    }

    _handleAction(quantity) {
        if (!this.itemData) return;

        const craftPromise = this.onAction(this.itemData, quantity)
            .catch(error => {
                console.error('Craft action failed:', error.message);
            })
            .finally(() => {
                if (this.active && this.scene) {
                    this.actionArea.update(this.scene, this.itemData);
                }
            });

        this.actionArea.actionButton.trackPromise(craftPromise);
    }
}