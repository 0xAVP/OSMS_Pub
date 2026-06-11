import {TabController} from '../components/TabController.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {ChildPanelManager} from '../components/ChildPanelManager.js';
import {CraftDetailView} from './craft/CraftDetailView.js';
import {startCraft} from '../processing/craftHandler.js';
import {createBlueprintsTab} from './craft/tabs/BlueprintsTab.js';
import {createFactoryManager} from './craft/tabs/FactoryTab.js';
import {getCatalogData} from '../../wallet/catalog.js';

/**
 * Фабричная функция для создания контейнера с контентом для панели крафта.
 */
export function createCraftPanelContent(scene, panelConfig) {
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

    let allBlueprints = [];
    let selectedBlueprintKey = null;
    let activeSortId = 'all';
    let activeTabId = 'blueprints';

    childPanelManager.register('craftDetail', (data) => {
        const detailView = new CraftDetailView(scene, {
            onAction: async (itemData, quantity) => {
                if (!itemData.originalBlueprint) {
                    throw new Error("Original blueprint data is missing for crafting!");
                }
                await startCraft(scene, itemData.originalBlueprint, quantity);
            }
        });
        detailView.setItem(data.viewData);
        return detailView;
    });

    const render = () => {
        let filteredBlueprints = allBlueprints;
        if (activeSortId !== 'all') {
            filteredBlueprints = allBlueprints.filter(bp => {
                if (!bp.itemCrafted) return false;
                const itemKey = Object.keys(bp.itemCrafted)[0];
                if (!itemKey) return false;
                return bp.itemCrafted[itemKey]?.category === activeSortId;
            });
        }
        blueprintsTab.update(filteredBlueprints, selectedBlueprintKey);

        const selectedBlueprintData = allBlueprints.find(bp => bp.key === selectedBlueprintKey);

        if (selectedBlueprintData) {

            const itemCraftedKey = Object.keys(selectedBlueprintData.itemCrafted || {})[0];
            const itemCraftedCategory = selectedBlueprintData.itemCrafted[itemCraftedKey]?.category;
            const itemToDisplayInfo = getCatalogData(scene, itemCraftedKey, itemCraftedCategory);

            const viewData = {
                name: itemToDisplayInfo.name,
                key: itemCraftedKey,
                rarity: itemToDisplayInfo.rarity,
                description: itemToDisplayInfo.description,
                timetocraft: selectedBlueprintData.timetocraft,
                requiredResources: selectedBlueprintData.requiredResources,
                originalBlueprint: selectedBlueprintData
            };

            if (childPanelManager.activePanel && childPanelManager.activePanel.visible) {

                const detailView = childPanelManager.activePanel.content;
                if (detailView && typeof detailView.setItem === 'function') {
                    detailView.setItem(viewData);
                }
            } else {

                childPanelManager.show('craftDetail', {viewData, title: 'Craft Item'}, {
                    alignX: 'right',
                    alignY: 'top',
                    height: 600,
                    width: 620,
                    useScanAnimation: true
                });
            }
        } else {

            childPanelManager.hide();
        }
    };

    const fetchAllBlueprints = () => {
        return [
            ...(scene.catalog.blueprints?.components || []),
            ...(scene.catalog.blueprints?.modules || []),
            ...(scene.catalog.blueprints?.hulls || []),
            ...(scene.catalog.blueprints?.other || []),
        ];
    };

    const blueprintsTab = createBlueprintsTab({
        scene,
        availableHeight: initialListHeight,
        totalWidth: availableWidth,
        onSortChange: (sortId) => {
            activeSortId = sortId;
            selectedBlueprintKey = null;
            render();
        },
        onItemSelected: (blueprintData) => {
            selectedBlueprintKey = selectedBlueprintKey === blueprintData.key ? null : blueprintData.key;
            render();
        }
    });

    const {factoryContainer, updateFactoryUI, destroy: destroyFactoryManager} = createFactoryManager(scene);

    const handlePanelResize = (data) => {
        const newListHeight = data.availableHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;

        if (blueprintsTab.container && typeof blueprintsTab.container.resize === 'function') {
            blueprintsTab.container.resize(newListHeight);
        }
    };

    contentContainer.on('panel-resized', handlePanelResize);

    blueprintsTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    factoryContainer.setPosition(CONTENT_START_X + availableWidth / 2, CONTENT_START_Y_TABS);
    contentContainer.add([blueprintsTab.container, factoryContainer]);
    factoryContainer.setVisible(false);

    const tabController = new TabController(scene, {
        x: CONTENT_START_X + (availableWidth / 2),
        y: CONTENT_START_Y_BASE + (TABS_AREA_HEIGHT / 2),
        tabs: [{id: 'blueprints', label: 'Blueprints'}, {id: 'factory', label: 'Factory'}]
    });

    tabController.on('tab-selected', (tabId) => {
        activeTabId = tabId;
        selectedBlueprintKey = null;

        blueprintsTab.container.setVisible(tabId === 'blueprints');
        factoryContainer.setVisible(tabId === 'factory');

        if (tabId === 'factory') {
            updateFactoryUI();
        }

        render();
    });

    contentContainer.add(tabController);

    const onInventoryUpdate = () => {
        render();
    };

    scene.events.on('factoriesUpdated', updateFactoryUI);
    scene.events.on('inventory-updated', onInventoryUpdate);

    contentContainer.on('destroy', () => {
        scene.events.off('factoriesUpdated', updateFactoryUI);
        scene.events.off('inventory-updated', onInventoryUpdate);
        contentContainer.off('panel-resized', handlePanelResize);
        destroyFactoryManager();
        childPanelManager.destroy();
    });

    allBlueprints = fetchAllBlueprints();
    render();

    return contentContainer;
}
