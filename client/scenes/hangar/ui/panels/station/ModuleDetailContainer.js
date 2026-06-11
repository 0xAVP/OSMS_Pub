import Phaser from 'phaser';
import {ItemDetailView} from '../inventory/ItemDetailView.js';
import {ShipModuleUpgradeView} from './ShipModuleUpgradeView';
import {getSlotDisplayName, getDefaultIconForSlot} from './stationUtils';
import {TwoColumnLayout} from '../../layouts/TwoColumnLayout.js';

const LAYOUT_CONFIG = {
    leftColumnWidth: 230,
    rightColumnWidth: 350,
    columnGap: 40,
    height: 560,
};

export class ModuleDetailContainer extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, 0, 0);

        this.panelWidth = config.width;
        this.panelHeight = config.height;

        this._createUI();
        this._attachEventListeners();

        this._attachSceneEventListeners();

    }

    _createUI() {
        this.layout = new TwoColumnLayout(this.scene, LAYOUT_CONFIG);
        this.detailView = new ItemDetailView(this.scene, LAYOUT_CONFIG.leftColumnWidth);
        this.upgradeView = new ShipModuleUpgradeView(this.scene, {width: LAYOUT_CONFIG.rightColumnWidth});

        this.layout.leftContainer.add(this.detailView);
        this.layout.rightContainer.add(this.upgradeView);

        this.add(this.layout);
    }

    _attachEventListeners() {
        this.upgradeView.on('upgrade-click', (data) => {
            this.emit('initiate-upgrade', data);
        });
        this.upgradeView.on('replace-click', () => {
            this.emit('initiate-replace');
        });
        this.upgradeView.on('install-click', () => {
            this.emit('initiate-replace');
        });
    }

    /**
     * @private
     * Подписывается на глобальные события сцены для управления состоянием кнопок.
     */
    _attachSceneEventListeners() {

        this.handlePanelOpen = (panelData) => {

            if (panelData.id === 'replaceModule') {
                this.upgradeView.ui.actionButton.disable();
            }
        };

        this.handlePanelClose = (panelData) => {

            if (panelData.id === 'replaceModule') {

                this.upgradeView.ui.actionButton.enableState(this.upgradeView.isActionPossible);
            }
        };

        this.scene.events.on('side-panel-opened', this.handlePanelOpen, this);
        this.scene.events.on('side-panel-closed', this.handlePanelClose, this);

        this.on('destroy', () => {
            this.scene.events.off('side-panel-opened', this.handlePanelOpen, this);
            this.scene.events.off('side-panel-closed', this.handlePanelClose, this);
        });
    }

    setItem(itemData, slotKey) {
        this.setVisible(true);

        this.upgradeView.setItem(itemData);

        if (itemData) {
            this.detailView.setItem(itemData);
        } else {
            const emptyData = {
                name: `Empty ${getSlotDisplayName(slotKey)} Slot`,
                key: getDefaultIconForSlot(slotKey),
                level: '-',
                rarity: 'default',
                description: 'No module installed in this slot. Press "Install" to choose a module from your inventory.'
            };
            this.detailView.setItem(emptyData);
        }

    }

    getUpgradeView() {
        return this.upgradeView;
    }
}
