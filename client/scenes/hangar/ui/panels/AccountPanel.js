import {TabController} from '../components/TabController.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {createAccountTab} from './account/AccountTab.js';
import {createReferralsTab} from './account/ReferralsTab.js';
import {createTokenTab} from './account/TokenTab.js';

export function createAccountPanelContent(scene, panelConfig) {
    const contentContainer = scene.add.container(0, 0);

    const CONTENT_START_X = PANEL_DEFAULTS.padding;
    const CONTENT_START_Y_BASE = PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding;
    const TABS_AREA_HEIGHT = 50;
    const GAP_BELOW_TABS = 20;
    const CONTENT_START_Y_TABS = CONTENT_START_Y_BASE + TABS_AREA_HEIGHT + GAP_BELOW_TABS;
    const initialTotalContentHeight = (panelConfig.height || scene.scale.height) - (PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding * 2);
    const initialTabContentHeight = initialTotalContentHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
    const availableWidth = panelConfig.width - (PANEL_DEFAULTS.padding * 2);

    const accountTab = createAccountTab(scene, availableWidth, initialTabContentHeight);
    const referralsTab = createReferralsTab(scene, availableWidth, initialTabContentHeight);
    const tokenTab = createTokenTab(scene, availableWidth, initialTabContentHeight);

    const tabs = [accountTab, referralsTab, tokenTab];

    tabs.forEach(tab => {
        tab.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
        contentContainer.add(tab);
        tab.setVisible(false);
    });

    accountTab.setVisible(true);

    const tabController = new TabController(scene, {
        x: CONTENT_START_X + (availableWidth / 2),
        y: CONTENT_START_Y_BASE + (TABS_AREA_HEIGHT / 2),
        tabs: [
            {id: 'account', label: 'Overview'},
            {id: 'token', label: 'Token'},
            {id: 'referrals', label: 'Referrals'},
        ]
    });

    tabController.on('tab-selected', (tabId) => {
        accountTab.setVisible(tabId === 'account');
        referralsTab.setVisible(tabId === 'referrals');
        tokenTab.setVisible(tabId === 'token');
    });

    contentContainer.add(tabController);

    const handlePanelResize = (data) => {
        const newTabContentHeight = data.availableHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
        tabs.forEach(tab => {
            if (tab && typeof tab.resize === 'function') {
                tab.resize(newTabContentHeight);
            }
        });
    };

    contentContainer.update = () => {

        if (accountTab.visible && typeof accountTab.refreshData === 'function') {
            accountTab.refreshData();
        } else if (accountTab.visible && typeof accountTab.update === 'function') {
            accountTab.update();
        }

    };

    contentContainer.on('panel-resized', handlePanelResize);
    contentContainer.on('destroy', () => {
        contentContainer.off('panel-resized', handlePanelResize);
    });

    return contentContainer;
}