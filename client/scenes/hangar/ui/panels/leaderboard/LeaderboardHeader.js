const STYLES = {
    playerRankValue: {fontFamily: 'Tektur', fontSize: '48px', color: '#FEBA00', fontStyle: 'bold'},
    playerAddress: {fontFamily: 'Tektur', fontSize: '14px', color: '#82d4ff'},
    sectionHeader: {fontFamily: 'Tektur', fontSize: '16px', color: '#a0a0a0'},
    seasonInfo: {fontFamily: 'Tektur', fontSize: '16px', color: '#e0e0e0', lineSpacing: 5},
    playerStats: {fontFamily: 'Tektur', fontSize: '16px', color: '#e0e0e0', lineSpacing: 5, align: 'right'},
};

const LAYOUT = {
    HEADER_HEIGHT: 200,
    PADDING: 25,
};

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
}

export function createLeaderboardHeader(scene, totalWidth) {
    const headerContainer = scene.add.container(0, 0);

    const graphics = scene.add.graphics();
    const dividerY = 70;
    const topSectionCenterY = dividerY / 2;

    const playerRankValueText = scene.add.text(LAYOUT.PADDING, topSectionCenterY, '', STYLES.playerRankValue).setOrigin(0, 0.5);
    const playerAddressText = scene.add.text(0, topSectionCenterY, '', STYLES.playerAddress).setOrigin(0, 0.5);

    const statsBlockY = dividerY + 15;
    const seasonHeader = scene.add.text(LAYOUT.PADDING, statsBlockY, 'SEASON INFO', STYLES.sectionHeader).setOrigin(0, 0);
    const seasonInfoText = scene.add.text(LAYOUT.PADDING, statsBlockY + seasonHeader.height + 8, '', STYLES.seasonInfo).setOrigin(0, 0);
    const statsHeader = scene.add.text(totalWidth - LAYOUT.PADDING, statsBlockY, 'YOUR PERFORMANCE', STYLES.sectionHeader).setOrigin(1, 0);
    const playerStatsText = scene.add.text(totalWidth - LAYOUT.PADDING, statsBlockY + statsHeader.height + 8, '', STYLES.playerStats).setOrigin(1, 0);

    headerContainer.add([
        graphics, playerRankValueText, playerAddressText,
        seasonHeader, seasonInfoText, statsHeader, playerStatsText,
    ]);

    const redrawHeader = () => {
        graphics.clear();
        graphics.fillStyle(0x1A1325, 0.85).fillRoundedRect(0, 0, totalWidth, LAYOUT.HEADER_HEIGHT, 10);
        graphics.lineStyle(1, 0x41C6FF, 0.2).lineBetween(LAYOUT.PADDING, dividerY, totalWidth - LAYOUT.PADDING, dividerY);
    };

    redrawHeader();

    headerContainer.updateData = (seasonNumber, startDate, endDate, playerData) => {
        const shortAddress = scene.walletAddress ? `${scene.walletAddress.slice(0, 6)}...${scene.walletAddress.slice(-4)}` : '';

        if (seasonNumber) {
            seasonInfoText.setText(`Season ${seasonNumber}\n${formatDate(startDate)} - ${formatDate(endDate)}`);
        } else {
            seasonInfoText.setText(`Off Season\nCheck back soon`);
        }

        if (playerData && playerData.rank) {
            playerRankValueText.setText(`#${playerData.rank.toLocaleString()}`);
            playerAddressText.setText(`(You: ${shortAddress})`);
            const playerPts = playerData.pts || 0;
            playerStatsText.setText(`Best Stage: ${playerData.maxStage}\nBest Kills: ${playerData.bestKills}\nTotal PTS: ${playerPts.toLocaleString()}`);
        } else {
            playerRankValueText.setText('Unranked');
            playerAddressText.setText(`(You: ${shortAddress})`);
            playerStatsText.setText('Start mission to\nget ranked!');
        }

        playerAddressText.setX(playerRankValueText.x + playerRankValueText.width + 15);
    };

    return headerContainer;
}
