import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {TabController} from '../components/TabController.js';
import {createLeaderboardTab} from './leaderboard/LeaderboardTab.js';

import {createRewardsTab} from './leaderboard/RewardsTab.js';
import {webSocketManager} from '../../WebSocketManager.js';

export function createLeaderboardPanelContent(scene, panelConfig) {
    const contentContainer = scene.add.container(0, 0);

    const CONTENT_START_X = PANEL_DEFAULTS.padding;
    const CONTENT_START_Y_BASE = PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding;
    const TABS_AREA_HEIGHT = 50;
    const GAP_BELOW_TABS = 20;
    const CONTENT_START_Y_TABS = CONTENT_START_Y_BASE + TABS_AREA_HEIGHT + GAP_BELOW_TABS;

    const initialTotalContentHeight = (panelConfig.height || scene.scale.height) - (PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding * 2);
    const initialTabContentHeight = initialTotalContentHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
    const availableWidth = panelConfig.width - (PANEL_DEFAULTS.padding * 2);

    const leaderboardTab = createLeaderboardTab(scene, availableWidth, initialTabContentHeight);
    const rewardsTab = createRewardsTab(scene, availableWidth, initialTabContentHeight);

    leaderboardTab.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    rewardsTab.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);

    contentContainer.add([leaderboardTab, rewardsTab]);
    rewardsTab.setVisible(false);

    const tabController = new TabController(scene, {
        x: CONTENT_START_X + (availableWidth / 2),
        y: CONTENT_START_Y_BASE + (TABS_AREA_HEIGHT / 2),
        tabs: [
            {id: 'leaderboard', label: 'Leaderboard'},
            {id: 'rewards', label: 'Rewards'}
        ]
    });
    contentContainer.add(tabController);

    tabController.on('tab-selected', (tabId) => {
        leaderboardTab.setVisible(tabId === 'leaderboard');
        rewardsTab.setVisible(tabId === 'rewards');
    });

    async function fetchLeaderboardData() {

        leaderboardTab.setLoading(true);

        try {
            const response = await webSocketManager.sendMessage('get-leaderboard', {offset: 0});

            if (response && response.success) {
                if (response.data && response.data.seasonNumber) {

                    leaderboardTab.updateData(
                        response.data.seasonNumber,
                        response.data.startDate,
                        response.data.endDate,
                        response.data.topPlayers,
                        response.data.playerData
                    );
                    rewardsTab.update(response.data.rewards);
                } else {
                    leaderboardTab.setError("There is no active season running.");
                }
            } else {
                leaderboardTab.setError(response.error || 'Failed to retrieve data.');
            }
        } catch (error) {
            leaderboardTab.setError(error.message || 'Connection error.');
        }
    }

    const handlePanelResize = (data) => {
        const newTabContentHeight = data.availableHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
        if (leaderboardTab && typeof leaderboardTab.resize === 'function') {
            leaderboardTab.resize(newTabContentHeight);
        }
        if (rewardsTab && typeof rewardsTab.resize === 'function') {
            rewardsTab.resize(newTabContentHeight);
        }
    };
    contentContainer.on('panel-resized', handlePanelResize);
    contentContainer.on('destroy', () => {
        contentContainer.off('panel-resized', handlePanelResize);
    });

    fetchLeaderboardData();

    return contentContainer;
}
