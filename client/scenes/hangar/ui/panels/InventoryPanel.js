import {TabController} from '../components/TabController.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {ChildPanelManager} from '../components/ChildPanelManager.js';
import {createItemsTab} from './inventory/tabs/ItemsTab.js';
import {createShipsTab} from './inventory/tabs/ShipsTab.js';
import {createEchoesTab} from './inventory/tabs/EchoesTab.js';
import {collectAllItems} from "../actionUtils.js";
import {SendItemPanel} from './SendItemPanel.js';
import {ItemDetailContainer} from './inventory/ItemDetailContainer.js';

/**
 * Фабричная функция для создания контейнера с контентом для панели инвентаря.
 */
export function createInventoryPanelContent(scene, panelConfig) {
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

    let allItems = [], allShips = [], allEchoes = [];
    let selectedItemIdentifier = null;
    let activeSortId = 'all';
    let activeTabId = 'items';

    childPanelManager.register('itemDetail', (data) => {
        const childPanelConfig = data.finalPanelConfig;
        const panelWidth = childPanelConfig.width - childPanelConfig.padding * 2;
        const panelHeight = childPanelConfig.height - childPanelConfig.padding * 2;

        const detailContainer = new ItemDetailContainer(scene, {width: panelWidth, height: panelHeight});
        detailContainer.on('open-send-panel', (itemData) => scene.modalManager.show('sendItem', itemData));
        detailContainer.setItem(data.item);
        return detailContainer;
    });

    const render = () => {
        let dataSource = [], identifierKey = 'key', filteredDataSource = [];

        switch (activeTabId) {
            case 'items':
                dataSource = allItems;
                identifierKey = 'uid';
                filteredDataSource = allItems;
                if (activeSortId !== 'all') {
                    if (activeSortId === 'resources') {
                        filteredDataSource = allItems.filter(item => item.category === 'resources' || item.category === 'components');
                    } else {
                        filteredDataSource = allItems.filter(item => item.category === activeSortId);
                    }
                }
                itemsTab.update(filteredDataSource, selectedItemIdentifier);
                break;
            case 'ships':
                dataSource = allShips;
                identifierKey = 'shipId';
                shipsTab.update(allShips, selectedItemIdentifier);
                break;
            case 'echoes':
                dataSource = allEchoes;
                identifierKey = 'id';
                echoesTab.update(allEchoes, selectedItemIdentifier);
                break;
        }

        let selectedItemData = null;
        if (selectedItemIdentifier !== null) {
            if (identifierKey === 'uid') {

                selectedItemData = dataSource.find(item => (item.uid || item.key) === selectedItemIdentifier);
            } else {
                selectedItemData = dataSource.find(item => item[identifierKey] === selectedItemIdentifier);
            }
        }

        if (!selectedItemData) {
            selectedItemIdentifier = null;
        }

        if (selectedItemData) {
            const detailPanelConfig = {height: 600, alignX: 'right', alignY: 'top'};

            if (childPanelManager.activePanel && childPanelManager.activePanel.visible) {

                const detailContainer = childPanelManager.activePanel.content;
                if (detailContainer && typeof detailContainer.setItem === 'function') {
                    detailContainer.setItem(selectedItemData);
                }
            } else {

                childPanelManager.show('itemDetail', {item: selectedItemData}, detailPanelConfig);
            }
        } else {
            childPanelManager.hide();
        }
    };

    const fetchAllData = () => {
        allItems = collectAllItems(scene);
        allShips = scene.ships || [];
        allEchoes = scene.pilots || [];
    };

    const commonTabConfig = {
        scene,
        totalWidth: availableWidth,
        availableHeight: initialListHeight,
        onSortChange: (sortId) => {
            activeSortId = sortId;
            selectedItemIdentifier = null;
            render();
        },
    };

    const itemsTab = createItemsTab({
        ...commonTabConfig,
        onItemSelected: (item) => {
            const identifier = item.uid || item.key;
            selectedItemIdentifier = selectedItemIdentifier === identifier ? null : identifier;
            render();
        }
    });

    const shipsTab = createShipsTab({
        ...commonTabConfig,
        onItemSelected: (ship) => {
            selectedItemIdentifier = selectedItemIdentifier === ship.shipId ? null : ship.shipId;
            render();
        }
    });

    const echoesTab = createEchoesTab({
        ...commonTabConfig,
        onItemSelected: (pilot) => {
            selectedItemIdentifier = selectedItemIdentifier === pilot.id ? null : pilot.id;
            render();
        }
    });

    const handlePanelResize = (data) => {
        const newListHeight = data.availableHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
        [itemsTab, shipsTab, echoesTab].forEach(tab => {
            if (tab.container && typeof tab.container.resize === 'function') {
                tab.container.resize(newListHeight);
            }
        });
    };
    contentContainer.on('panel-resized', handlePanelResize);

    itemsTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    shipsTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    echoesTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    contentContainer.add([itemsTab.container, shipsTab.container, echoesTab.container]);
    shipsTab.container.setVisible(false);
    echoesTab.container.setVisible(false);

    const tabController = new TabController(scene, {
        x: CONTENT_START_X + (availableWidth / 2),
        y: CONTENT_START_Y_BASE + (TABS_AREA_HEIGHT / 2),
        tabs: [{id: 'items', label: 'Items'}, {id: 'ships', label: 'Ships'}, {id: 'echoes', label: 'Echoes'}]
    });

    tabController.on('tab-selected', (tabId) => {
        activeTabId = tabId;
        selectedItemIdentifier = null;
        itemsTab.container.setVisible(tabId === 'items');
        shipsTab.container.setVisible(tabId === 'ships');
        echoesTab.container.setVisible(tabId === 'echoes');
        render();
    });
    contentContainer.add(tabController);

    const onInventoryUpdate = () => {
        fetchAllData();
        render();
    };
    scene.events.on('inventory-updated', onInventoryUpdate);

    contentContainer.on('destroy', () => {
        scene.events.off('inventory-updated', onInventoryUpdate);
        contentContainer.off('panel-resized', handlePanelResize);
        childPanelManager.destroy();
    });

    fetchAllData();
    render();

    return contentContainer;
}
