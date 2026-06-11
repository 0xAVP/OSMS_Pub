import {ScrollableList} from '../../components/ScrollableList.js';
import {LeaderboardItem} from './LeaderboardItem.js';
import {createLeaderboardHeader} from './LeaderboardHeader.js';

const STYLES = {
    status: {fontFamily: 'Tektur', fontSize: '18px', color: '#a0a0a0', align: 'center'}
};

const LAYOUT = {
    HEADER_AREA_HEIGHT: 200,
    HEADER_TO_LIST_GAP: 20,
};

export function createLeaderboardTab(scene, totalWidth, availableHeight) {
    const mainContainer = scene.add.container(0, 0);
    let currentPlayerWalletAddress = scene.walletAddress;

    const header = createLeaderboardHeader(scene, totalWidth);
    header.setVisible(false);
    mainContainer.add(header);

    const statusText = scene.add.text(totalWidth / 2, availableHeight / 2 - 50, '', STYLES.status).setOrigin(0.5);
    mainContainer.add(statusText);

    const listAvailableHeight = availableHeight - LAYOUT.HEADER_AREA_HEIGHT - LAYOUT.HEADER_TO_LIST_GAP;
    const listStartY = LAYOUT.HEADER_AREA_HEIGHT + LAYOUT.HEADER_TO_LIST_GAP;

    const list = new ScrollableList(scene, {
        width: totalWidth,
        height: listAvailableHeight,
        scrollbarPosition: 'right',
        rowHeight: 70,
        gap: 10,
    });

    const leaderboardItemFactory = (playerData) => {
        const SCROLLBAR_WIDTH = 10;
        const GAP = 20;
        const listContentWidth = totalWidth - SCROLLBAR_WIDTH - GAP;
        const isPlayer = playerData.walletAddress.toLowerCase() === currentPlayerWalletAddress.toLowerCase();
        const listItem = new LeaderboardItem(scene, {
            width: listContentWidth,
            playerData: playerData,
            isPlayer: isPlayer
        });
        listItem.disableInteractive();
        return listItem;
    };

    list.setPosition(0, listStartY);
    list.setVisible(false);
    mainContainer.add(list);

    mainContainer.setLoading = (isLoading) => {
        statusText.setText(isLoading ? 'Loading Leaderboard...' : '');
        statusText.setVisible(isLoading);
        header.setVisible(!isLoading);
        list.setVisible(!isLoading);
    };

    mainContainer.setError = (message) => {
        statusText.setText(`Error: ${message}`);
        statusText.setVisible(true);
        header.setVisible(false);
        list.setVisible(false);
    };

    mainContainer.updateData = (seasonNumber, startDate, endDate, topPlayers, playerData) => {
        mainContainer.setLoading(false);

        header.updateData(seasonNumber, startDate, endDate, playerData);
        list.populate(topPlayers || [], leaderboardItemFactory);
    };

    mainContainer.resize = (newHeight) => {
        availableHeight = newHeight;

        const newListHeight = availableHeight - LAYOUT.HEADER_AREA_HEIGHT - LAYOUT.HEADER_TO_LIST_GAP;
        if (list && typeof list.resize === 'function') {
            list.resize(newListHeight);
        }
    };

    return mainContainer;
}
