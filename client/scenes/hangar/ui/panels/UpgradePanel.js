import {TabController} from '../components/TabController.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {ChildPanelManager} from '../components/ChildPanelManager.js';
import {UpgradeModuleContainer} from './upgrade/UpgradeModuleContainer.js';
import {DismantleModuleContainer} from './upgrade/DismantleModuleContainer.js';
import {startUpgrade, startDismantle} from '../processing/upgradeHandler.js';
import {createUpgradeTabContent} from './upgrade/tabs/UpgradeTab.js';
import {createDismantleTab} from './upgrade/tabs/DismantleTab.js';
import {getCatalogData} from '../../wallet/catalog.js';

export function createUpgradePanelContent(scene, panelConfig) {
    const contentContainer = scene.add.container(0, 0);

    const CONTENT_START_X = PANEL_DEFAULTS.padding;
    const CONTENT_START_Y_BASE = PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding;
    const TABS_AREA_HEIGHT = 50;
    const GAP_BELOW_TABS = 20;
    const CONTENT_START_Y_TABS = CONTENT_START_Y_BASE + TABS_AREA_HEIGHT + GAP_BELOW_TABS;
    const initialTotalContentHeight = (panelConfig.height || scene.scale.height) - (PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding * 2);
    const initialListHeight = initialTotalContentHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
    const availableWidth = panelConfig.width - (PANEL_DEFAULTS.padding * 2);
    const childPanelManager = new ChildPanelManager(scene, contentContainer);
    let allModules = [];
    let selectedModuleUID = null;
    let activeSortId = 'all';
    let activeTabId = 'upgrade';

    childPanelManager.register('upgradeDetail', (data) => {
        const detailContainer = new UpgradeModuleContainer(scene, {
            onAction: (moduleData, quantity) => {

                return startUpgrade(scene, moduleData, quantity);
            }
        });
        detailContainer.setItem(data.module);
        return detailContainer;
    });

    childPanelManager.register('dismantleDetail', (data) => {
        const detailContainer = new DismantleModuleContainer(scene, {
            onAction: (moduleData) => {

                return startDismantle(scene, moduleData)
                    .finally(() => {

                        if (childPanelManager.activePanel && childPanelManager.activePanel.visible) {
                            childPanelManager.hide();
                            selectedModuleUID = null;
                            render();
                        }
                    });
            }
        });
        detailContainer.setItem(data.module);
        return detailContainer;
    });

    const render = () => {

        let filteredModules = allModules;
        if (activeSortId !== 'all') {
            filteredModules = allModules.filter(module => module.type === activeSortId);
        }
        filteredModules.sort((a, b) => (b.level || 0) - (a.level || 0));

        if (activeTabId === 'upgrade') {
            upgradeTab.update(filteredModules, selectedModuleUID);
        } else {
            dismantleTab.update(filteredModules, selectedModuleUID);
        }

        const selectedModuleData = allModules.find(m => m.uid === selectedModuleUID);

        if (selectedModuleData) {
            const panelType = activeTabId === 'upgrade' ? 'upgradeDetail' : 'dismantleDetail';

            const detailPanelConfig = {
                width: 620,
                height: 600,
                alignX: 'right',
                alignY: 'top',
                useScanAnimation: true,
            };

            if (childPanelManager.activePanel && childPanelManager.activePanel.visible) {
                const detailView = childPanelManager.activePanel.content;
                if (detailView && typeof detailView.setItem === 'function') {
                    detailView.setItem(selectedModuleData);
                }
            } else {
                childPanelManager.show(panelType, {
                    module: selectedModuleData,
                    title: 'Module Details'
                }, detailPanelConfig);
            }

        } else {
            childPanelManager.hide();
        }
    };

    const fetchAllModules = () => {
        return Object.entries(scene.inventoryItems.modules || {}).map(([uid, inventoryData]) => {
            const catalogData = getCatalogData(scene, inventoryData.key, "modules") || {};
            return {...catalogData, ...inventoryData, uid: uid};
        });
    };

    const upgradeTab = createUpgradeTabContent({
        scene,
        availableHeight: initialListHeight,
        totalWidth: availableWidth,
        onSortChange: (sortId) => {
            activeSortId = sortId;
            selectedModuleUID = null;
            render();
        },
        onItemSelected: (itemData) => {
            selectedModuleUID = selectedModuleUID === itemData.uid ? null : itemData.uid;
            render();
        }
    });

    const dismantleTab = createDismantleTab({
        scene,
        availableHeight: initialListHeight,
        totalWidth: availableWidth,
        onSortChange: (sortId) => {
            activeSortId = sortId;
            selectedModuleUID = null;
            render();
        },
        onItemSelected: (itemData) => {
            selectedModuleUID = selectedModuleUID === itemData.uid ? null : itemData.uid;
            render();
        }
    });

    const handlePanelResize = (data) => {
        const newListHeight = data.availableHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
        if (upgradeTab.container && typeof upgradeTab.container.resize === 'function') {
            upgradeTab.container.resize(newListHeight);
        }
        if (dismantleTab.container && typeof dismantleTab.container.resize === 'function') {
            dismantleTab.container.resize(newListHeight);
        }
    };

    contentContainer.on('panel-resized', handlePanelResize);

    upgradeTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    dismantleTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    contentContainer.add([upgradeTab.container, dismantleTab.container]);
    dismantleTab.container.setVisible(false);

    const tabController = new TabController(scene, {
        x: CONTENT_START_X + (availableWidth / 2),
        y: CONTENT_START_Y_BASE + (TABS_AREA_HEIGHT / 2),
        tabs: [{id: 'upgrade', label: 'Upgrade'}, {id: 'dismantle', label: 'Dismantle'}]
    });

    tabController.on('tab-selected', (tabId) => {
        activeTabId = tabId;
        selectedModuleUID = null;
        upgradeTab.container.setVisible(tabId === 'upgrade');
        dismantleTab.container.setVisible(tabId === 'dismantle');
        render();
    });

    contentContainer.add(tabController);

    const onInventoryUpdate = () => {
        allModules = fetchAllModules();
        render();
    };
    scene.events.on('inventory-updated', onInventoryUpdate);

    contentContainer.on('destroy', () => {
        scene.events.off('inventory-updated', onInventoryUpdate);
        contentContainer.off('panel-resized', handlePanelResize);
        childPanelManager.destroy();
    });

    allModules = fetchAllModules();
    render();

    return contentContainer;
}
