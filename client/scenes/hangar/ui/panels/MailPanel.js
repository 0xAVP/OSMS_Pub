import {TabController} from '../components/TabController.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../components/SidePanel.js';
import {createMailTab} from './mail/MailTab.js';

/**
 * Фабричная функция для создания контейнера с контентом для почтовой панели.
 */
export function createMailPanelContent(scene, panelConfig) {
    const contentContainer = scene.add.container(0, 0);

    const CONTENT_START_X = PANEL_DEFAULTS.padding;
    const CONTENT_START_Y_BASE = PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding;
    const TABS_AREA_HEIGHT = 50;
    const GAP_BELOW_TABS = 20;
    const CONTENT_START_Y_TABS = CONTENT_START_Y_BASE + TABS_AREA_HEIGHT + GAP_BELOW_TABS;

    const initialTotalContentHeight = (panelConfig.height || scene.scale.height) - (PANEL_DEFAULTS.titleHeight + PANEL_DEFAULTS.padding * 2);
    const initialListHeight = initialTotalContentHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
    const availableWidth = panelConfig.width - (PANEL_DEFAULTS.padding * 2);

    let activeTabId = 'inbox';
    let allMails = {inbox: [], sent: []};

    const render = () => {
        const mailsToDisplay = allMails[activeTabId] || [];
        if (activeTabId === 'inbox') {
            inboxTab.update(mailsToDisplay);
        } else {
            sentTab.update(mailsToDisplay);
        }
    };

    const fetchAllMails = () => {
        allMails = {
            inbox: scene.mailData?.inbox || [],
            sent: scene.mailData?.sent || []
        };
    };

    const commonTabConfig = {
        scene,
        totalWidth: availableWidth,
        availableHeight: initialListHeight,
    };

    const inboxTab = createMailTab({...commonTabConfig, folder: 'inbox'});
    const sentTab = createMailTab({...commonTabConfig, folder: 'sent'});

    const handlePanelResize = (data) => {
        const newListHeight = data.availableHeight - TABS_AREA_HEIGHT - GAP_BELOW_TABS;
        if (inboxTab.container && typeof inboxTab.container.resize === 'function') {
            inboxTab.container.resize(newListHeight);
        }
        if (sentTab.container && typeof sentTab.container.resize === 'function') {
            sentTab.container.resize(newListHeight);
        }
    };
    contentContainer.on('panel-resized', handlePanelResize);

    inboxTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    sentTab.container.setPosition(CONTENT_START_X, CONTENT_START_Y_TABS);
    contentContainer.add([inboxTab.container, sentTab.container]);
    sentTab.container.setVisible(false);

    const tabController = new TabController(scene, {
        x: CONTENT_START_X + (availableWidth / 2),
        y: CONTENT_START_Y_BASE + (TABS_AREA_HEIGHT / 2),
        tabs: [
            {id: 'inbox', label: 'Inbox'},
            {id: 'sent', label: 'Sent'}
        ]
    });

    tabController.on('tab-selected', (tabId) => {
        activeTabId = tabId;
        inboxTab.container.setVisible(tabId === 'inbox');
        sentTab.container.setVisible(tabId === 'sent');
        render();
    });
    contentContainer.add(tabController);

    const onMailUpdate = () => {
        fetchAllMails();
        render();
    };

    scene.events.on('mail-list-changed', onMailUpdate);
    contentContainer.on('destroy', () => {
        scene.events.off('mail-list-changed', onMailUpdate);
        contentContainer.off('panel-resized', handlePanelResize);
        inboxTab.container.destroy();
        sentTab.container.destroy();
    });

    fetchAllMails();
    render();

    return contentContainer;
}
