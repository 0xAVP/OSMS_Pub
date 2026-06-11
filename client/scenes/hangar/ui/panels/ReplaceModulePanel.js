import Phaser from 'phaser';

import {ListItem} from '../components/ListItem.js';
import {getCatalogData} from '../../wallet/catalog.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {ChildPanelManager} from '../components/ChildPanelManager.js';
import {ModuleInstallDetailView} from './station/ModuleInstallDetailView.js';
import {TabController} from '../components/TabController.js';

import {FilterableListPanel} from '../components/FilterableListPanel.js';

const RARITY_ORDER = {
    'legendary': 5, 'epic': 4, 'rare': 3, 'uncommon': 2, 'common': 1, 'rookie': 0, 'default': -1
};

const TABS_AREA_HEIGHT = 50;
const GAP_BELOW_TABS = 20;

export class ReplaceModulePanel extends Phaser.GameObjects.Container {
    constructor(scene, panelConfig) {
        super(scene, 0, 0);
        this.panelConfig = panelConfig;
        this.contextData = null;
        this.selectedModuleUID = null;
        this.filteredModules = [];
        this.activeFilterId = 'all';
        this.childPanelManager = new ChildPanelManager(scene, this);
        this._createUI();
        this._registerChildPanel();
        this.scene.events.on('inventory-updated', this._handleInventoryUpdate, this);
        this.on('panel-resized', this.handlePanelResize, this);
        this.on('destroy', () => {
            this.scene.events.off('inventory-updated', this._handleInventoryUpdate, this);
            this.childPanelManager.destroy();
        });
    }

    _createUI() {
        const CONTENT_START_Y = PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding;
        const TABS_Y = CONTENT_START_Y + (TABS_AREA_HEIGHT / 2);
        const LIST_AREA_Y = TABS_Y + (TABS_AREA_HEIGHT / 2) + GAP_BELOW_TABS;

        const totalContentHeight = (this.panelConfig.height || this.scene.scale.height) - (PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding * 2);
        const listAvailableHeight = totalContentHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;

        const availableWidth = this.panelConfig.width - (PANEL_DEFAULTS.padding * 2);

        this.tabController = new TabController(this.scene, {
            x: this.panelConfig.width / 2,
            y: TABS_Y,
            tabs: [{id: 'install', label: 'Install'}]
        });
        this.add(this.tabController);

        const sortButtons = [
            {id: 'all'},
            {id: 'legendary', activeTexture: 'legendary_sign@1x', inactiveTexture: 'legendary_sign@1x'},
            {id: 'epic', activeTexture: 'epic_sign@1x', inactiveTexture: 'epic_sign@1x'},
            {id: 'rare', activeTexture: 'rare_sign@1x', inactiveTexture: 'rare_sign@1x'},
            {id: 'uncommon', activeTexture: 'uncommon_sign@1x', inactiveTexture: 'uncommon_sign@1x'},
            {id: 'common', activeTexture: 'common_sign@1x', inactiveTexture: 'common_sign@1x'}
        ];

        this.filterableListPanel = new FilterableListPanel({
            scene: this.scene,
            availableHeight: listAvailableHeight,
            totalWidth: availableWidth,
            sortButtons: sortButtons,
            itemFactory: (itemData) => this._moduleItemFactory(itemData),
            onSortChange: (filterId) => this._handleSortChange(filterId),
            sorterPosition: 'left',
            scrollbarPosition: 'right'
        });

        this.filterableListPanel.setPosition(PANEL_DEFAULTS.padding, LIST_AREA_Y);

        this.add(this.filterableListPanel);

    }

    handlePanelResize(data) {
        const newListHeight = data.availableHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;

        if (this.filterableListPanel && typeof this.filterableListPanel.resize === 'function') {
            this.filterableListPanel.resize(newListHeight);
        }
    }

    _registerChildPanel() {
        this.childPanelManager.register('installDetail', (data) => {
            const childPanelConfig = data.panelConfig;
            const panelWidth = childPanelConfig.width - childPanelConfig.padding * 2;
            const panelHeight = childPanelConfig.height - childPanelConfig.padding * 2;
            const detailView = new ModuleInstallDetailView(this.scene, {
                width: panelWidth, height: panelHeight,
            });

            detailView.on('install-click', (moduleToInstall) => {

                if (!this.contextData || typeof this.contextData.onInstall !== 'function') {
                    console.error("onInstall callback is not defined in contextData!");
                    return;
                }

                const installPromise = this.contextData.onInstall(moduleToInstall)
                    .catch(error => {

                        console.error("Install callback failed:", error);
                    });

                detailView.installButton.trackPromise(installPromise);
            });

            detailView.setItem(data.item);
            return detailView;
        });
    }

    setData(contextData) {
        this.contextData = contextData;
        this.selectedModuleUID = null;
        this.activeFilterId = 'all';
        this.childPanelManager.hide();
        this._updateFilteredAndSortedList();
    }

    _handleModuleSelect(moduleData) {
        if (this.selectedModuleUID === moduleData.uid) {
            this.selectedModuleUID = null;
            this.childPanelManager.hide();
        } else {
            this.selectedModuleUID = moduleData.uid;
            const detailPanelConfig = {
                width: 320, height: 650, padding: 20,
                alignX: 'left', alignY: 'top', gap: 20, useScanAnimation: true
            };
            this.childPanelManager.show(
                'installDetail',
                {item: moduleData, panelConfig: detailPanelConfig},
                detailPanelConfig
            );
        }
        this._updateList();
    }

    _handleInventoryUpdate() {
        if (this.contextData) {
            this._updateFilteredAndSortedList();
        }
    }

    _updateFilteredAndSortedList() {
        if (!this.contextData) {
            this.filteredModules = [];
            return;
        }

        const allModules = Object.entries(this.scene.inventoryItems.modules || {}).map(([uid, invData]) => {
            return {...getCatalogData(this.scene, invData.key, 'modules'), ...invData, uid: uid};
        });

        let processedModules = allModules.filter(module => module.type === this.contextData.type);

        const rarities = ['legendary', 'epic', 'rare', 'uncommon', 'common', 'rookie'];
        if (rarities.includes(this.activeFilterId)) {
            processedModules = processedModules.filter(module => module.rarity.toLowerCase() === this.activeFilterId);
        }

        processedModules.sort((a, b) => {
            const rarityA = RARITY_ORDER[a.rarity.toLowerCase()] ?? -1;
            const rarityB = RARITY_ORDER[b.rarity.toLowerCase()] ?? -1;
            if (rarityB !== rarityA) {
                return rarityB - rarityA;
            }
            return (b.level || 0) - (a.level || 0);
        });

        this.filteredModules = processedModules;
        this._updateList();
    }

    _handleSortChange(filterId) {
        this.activeFilterId = filterId;
        this._updateFilteredAndSortedList();
    }

    _moduleItemFactory(itemData) {

        const SORTER_WIDTH = 50;
        const GAP = 20;
        const SCROLLBAR_WIDTH = 10;
        const totalWidth = this.panelConfig.width - (PANEL_DEFAULTS.padding * 2);
        const listComponentWidth = totalWidth - SORTER_WIDTH - GAP;
        const listContentWidth = listComponentWidth - SCROLLBAR_WIDTH - GAP;

        const listItem = new ListItem(this.scene, {
            width: listContentWidth,
            height: 70,
            rarity: itemData.rarity,
            iconKey: itemData.key,
            label: `${itemData.name} (Lvl ${itemData.level})`
        });

        if (itemData.uid === this.selectedModuleUID) {
            listItem.setState('selected');
        }

        listItem.on('pointerdown', () => this._handleModuleSelect(itemData));
        listItem.on('pointerover', () => {
            if (itemData.uid !== this.selectedModuleUID) listItem.setState('hover');
        });
        listItem.on('pointerout', () => {
            if (itemData.uid !== this.selectedModuleUID) listItem.setState('idle');
        });

        return listItem;
    }

    _updateList() {

        this.filterableListPanel.update(this.filteredModules, this.selectedModuleUID);
    }
}