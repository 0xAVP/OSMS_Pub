import Phaser from 'phaser';
import {ShipModuleItem} from './station/ShipModuleItem.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {ChildPanelManager} from '../components/ChildPanelManager.js';
import {ModuleDetailContainer} from './station/ModuleDetailContainer.js';
import {startModuleInstall, startUpgrade} from '../processing/upgradeShipHandler.js';
import {
    MODULE_CONFIG,
    getSlotUid,
    getSlotDisplayName,
    getDefaultIconForSlot,
    getModuleByType
} from './station/stationUtils.js';

const STYLES = {
    header: {fontFamily: 'Tektur', fontSize: '18px', color: '#41C6FF', fontStyle: 'bold'}
};

const LAYOUT = {
    SECTION_SPACING: 25, HEADER_TO_ITEM_GAP: 15, ITEM_SPACING: 10, MODULE_ITEM_HEIGHT: 70
};

const MODULE_DETAIL_PANEL_CONFIG = {
    width: 620,
    height: 600,
    padding: 20,
    alignX: 'right',
    alignY: 'top',
    gap: 20,
    useScanAnimation: true
};

export class ShipStatusPanel extends Phaser.GameObjects.Container {
    constructor(scene, panelConfig) {
        super(scene, 0, 0);
        this.panelConfig = panelConfig;
        this.moduleItems = {};
        this.selectedSlotKey = null;
        this.childPanelManager = new ChildPanelManager(scene, this);
        this.currentShip = null;

        this._createUI();

        this.scene.events.on('shipChanged', this.onShipChanged, this);
        this.scene.events.on('moduleInShipUpgraded', this._onModuleUpgraded, this);
        this.scene.events.on('moduleInShipInstalled', this._onModuleInstalled, this);

        this.on('destroy', () => {
            this.scene.events.off('shipChanged', this.onShipChanged, this);
            this.scene.events.off('moduleInShipInstalled', this._onModuleInstalled, this);
            this.scene.events.off('moduleInShipUpgraded', this._onModuleUpgraded, this);
            this.childPanelManager.destroy();
        });

        this.onShipChanged();
    }

    onParentHide() {
        this.childPanelManager.hide();
        if (this.scene.sidePanelManager.isOpen('replaceModule')) {
            this.scene.sidePanelManager.close('replaceModule');
        }
    }

    _createUI() {
        const sections = [
            {title: 'ATTACK', keys: ['weapon1', 'weapon2']},
            {title: 'DEFENSE', keys: ['shield', 'armor']},
            {title: 'UTILITY', keys: ['engine', 'extra1', 'extra2']}
        ];
        let currentY = PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding;
        const contentWidth = this.panelConfig.width - (PANEL_DEFAULTS.padding * 2);
        sections.forEach(section => {
            currentY = this._createSection(section.title, section.keys, currentY, contentWidth);
        });

        this.childPanelManager.register('moduleDetailWithUpgrade', (data) => {
            const childPanelConfig = data.panelConfig;
            const panelWidth = childPanelConfig.width - childPanelConfig.padding * 2;
            const panelHeight = childPanelConfig.height - childPanelConfig.padding * 2;
            const detailContainer = new ModuleDetailContainer(this.scene, {
                width: panelWidth, height: panelHeight,
            });

            detailContainer.on('initiate-upgrade', ({item, quantity}) => {
                const upgradeView = detailContainer.getUpgradeView();

                if (!upgradeView || !upgradeView.active) return;

                const upgradePromise = startUpgrade(this.scene, item, quantity, this.currentShip.shipId)
                    .catch(error => {

                        console.error("Upgrade action failed:", error.message);
                    });

                const actionButton = upgradeView.ui.actionButton;

                if (actionButton) {
                    actionButton.trackPromise(upgradePromise);
                }
            });

            detailContainer.on('initiate-replace', () => {
                const currentShip = this.currentShip;
                const slotKey = this.selectedSlotKey;
                if (!currentShip || !slotKey) {
                    console.error("Cannot initiate replace: missing data from panel state.");
                    return;
                }
                const currentModuleData = getModuleByType(this.scene, slotKey);
                const moduleType = MODULE_CONFIG[slotKey]?.type;
                if (!moduleType) {
                    console.error(`Could not determine module type for slotKey: ${slotKey}`);
                    return;
                }

                const onInstallConfirm = async (moduleToInstall) => {
                    const slotUid = getSlotUid(currentShip, slotKey);

                    const executeInstall = () => {
                        return startModuleInstall(
                            this.scene, currentShip.shipId, moduleToInstall.uid, moduleToInstall.key,
                            slotKey, slotUid, currentModuleData?.uid || null
                        );
                    };

                    if (currentModuleData && currentModuleData.uid) {
                        return new Promise((resolve, reject) => {
                            this.scene.modalManager.show('confirm', {

                                width: 550,
                                height: 320,
                                message: `CAUTION: OVERWRITE!\n\nCurrently installed module will be DESTROYED and replaced by the new one.\n\nThis action cannot be undone.`,
                                onConfirm: async () => {
                                    try {
                                        await executeInstall();
                                        resolve();
                                    } catch (error) {
                                        reject(error);
                                    }
                                },
                                onCancel: () => {
                                    console.log('Module replacement cancelled.');
                                    resolve();
                                }
                            });
                        });
                    } else {
                        return executeInstall();
                    }
                };

                const contextData = {type: moduleType, onInstall: onInstallConfirm};
                this.scene.sidePanelManager.open('replaceModule', contextData);
            });
            detailContainer.setItem(data.item, data.slotKey);
            return detailContainer;
        });
    }

    _createSection(title, moduleKeys, startY, width) {
        let currentY = startY;
        const startX = PANEL_DEFAULTS.padding;
        const header = this.scene.add.text(startX, currentY, title, STYLES.header);
        this.add(header);
        currentY += header.height + LAYOUT.HEADER_TO_ITEM_GAP;
        moduleKeys.forEach(key => {
            const moduleItem = new ShipModuleItem(this.scene, {x: startX, y: currentY, width: width});
            this.add(moduleItem);
            this.moduleItems[key] = moduleItem;
            currentY += LAYOUT.MODULE_ITEM_HEIGHT + LAYOUT.ITEM_SPACING;
            moduleItem.on('click', () => this._handleModuleClick(key));
        });
        return currentY - LAYOUT.ITEM_SPACING + LAYOUT.SECTION_SPACING;
    }

    _handleModuleClick(slotKey) {
        if (this.scene.sidePanelManager.isOpen('replaceModule')) {
            this.scene.sidePanelManager.close('replaceModule');
        }
        if (this.selectedSlotKey === slotKey) {
            this.selectedSlotKey = null;
            this.childPanelManager.hide();
        } else {
            this.selectedSlotKey = slotKey;
            const moduleData = getModuleByType(this.scene, slotKey);
            this.childPanelManager.show(
                'moduleDetailWithUpgrade',
                {item: moduleData, slotKey: slotKey, panelConfig: MODULE_DETAIL_PANEL_CONFIG},
                MODULE_DETAIL_PANEL_CONFIG
            );
        }
        this._updateSelectionState();
    }

    _updateSelectionState() {
        for (const key in this.moduleItems) {
            const item = this.moduleItems[key];
            if (key === this.selectedSlotKey) {
                item.setState('selected');
            } else {
                item.setState('idle');
            }
        }
    }

    _onModuleUpgraded({newModule, toSlot}) {

        this._refreshAllModuleItems();

        if (this.childPanelManager.activePanel && this.childPanelManager.activePanel.visible && this.selectedSlotKey === toSlot) {

            const detailContainer = this.childPanelManager.activePanel.content;

            if (detailContainer && typeof detailContainer.setItem === 'function') {

                detailContainer.setItem(newModule, toSlot);
            } else {

                console.warn('Could not find setItem method on active child panel content. Falling back to recreating the panel.');
                this.childPanelManager.show(
                    'moduleDetailWithUpgrade',
                    {item: newModule, slotKey: toSlot, panelConfig: MODULE_DETAIL_PANEL_CONFIG},
                    MODULE_DETAIL_PANEL_CONFIG
                );
            }
        }
    }

    _refreshAllModuleItems() {
        const moduleSlots = Object.keys(MODULE_CONFIG);
        moduleSlots.forEach(slotKey => {
            const moduleData = getModuleByType(this.scene, slotKey);
            const moduleItem = this.moduleItems[slotKey];
            if (moduleData) {
                moduleItem.update({
                    name: moduleData.name, level: moduleData.level,
                    rarity: moduleData.rarity, iconKey: moduleData.key,
                });
            } else {
                moduleItem.update({
                    name: `Empty ${getSlotDisplayName(slotKey)}`, level: '-',
                    rarity: 'default', iconKey: getDefaultIconForSlot(slotKey),
                });
            }
        });
    }

    onShipChanged() {
        this.currentShip = this.scene.selectedShip;
        if (!this.currentShip) {
            console.warn('ShipStatusPanel: Cannot update without a selected ship.');
            return;
        }
        this.selectedSlotKey = null;
        this._updateSelectionState();
        this.childPanelManager.hide();
        if (this.scene.sidePanelManager.isOpen('replaceModule')) {
            this.scene.sidePanelManager.close('replaceModule');
        }
        this._refreshAllModuleItems();
    }

    _onModuleInstalled({newModuleInstalled, shipUpdatedId, toSlot}) {
        if (!this.currentShip || this.currentShip.shipId !== shipUpdatedId) {
            return;
        }
        this._refreshAllModuleItems();
        if (this.childPanelManager.activePanel && this.childPanelManager.activePanel.visible && this.selectedSlotKey === toSlot) {

            const detailContainer = this.childPanelManager.activePanel.content;
            if (detailContainer && typeof detailContainer.setItem === 'function') {
                detailContainer.setItem(newModuleInstalled, toSlot);
            } else {
                this.childPanelManager.show(
                    'moduleDetailWithUpgrade',
                    {item: newModuleInstalled, slotKey: toSlot, panelConfig: MODULE_DETAIL_PANEL_CONFIG},
                    MODULE_DETAIL_PANEL_CONFIG
                );
            }
        }
        if (this.scene.sidePanelManager.isOpen('replaceModule')) {
            this.scene.sidePanelManager.close('replaceModule');
        }
    }
}