import Phaser from 'phaser';

const STYLES = {

    rank: {fontFamily: 'Tektur', fontSize: '24px', fontStyle: 'bold', color: '#ffffff'},
    ptsValue: {fontFamily: 'Tektur', fontSize: '20px', fontStyle: 'bold', color: '#FEBA00'},

    address: {fontFamily: 'Tektur', fontSize: '14px', color: '#cccccc'},
    stats: {fontFamily: 'Tektur', fontSize: '14px', color: '#e0e0e0', align: 'right', lineSpacing: 2},
    ptsLabel: {fontFamily: 'Tektur', fontSize: '14px', color: '#a0a0a0'},
};

const LAYOUT = {
    HEIGHT: 70,
    PADDING: 20,
    RANK_TO_ADDRESS_GAP: 15,
    STATS_TO_PTS_GAP: 30,
};

export class LeaderboardItem extends Phaser.GameObjects.Container {
    constructor(scene, {width, playerData, isPlayer = false}) {
        super(scene, 0, 0);
        this.setSize(width, LAYOUT.HEIGHT);

        const bgColor = isPlayer ? 0x41C6FF : 0x2c2f38;
        const bgAlpha = isPlayer ? 0.25 : 0.5;
        const bg = scene.add.graphics()
            .fillStyle(bgColor, bgAlpha)
            .fillRoundedRect(0, 0, width, LAYOUT.HEIGHT, 8);
        this.add(bg);

        const ptsValueText = scene.add.text(
            width - LAYOUT.PADDING,
            LAYOUT.HEIGHT / 2,
            (playerData.pts || 0).toLocaleString(),
            STYLES.ptsValue
        ).setOrigin(1, 0.5);

        const ptsLabelText = scene.add.text(
            ptsValueText.x - ptsValueText.width - 8,
            LAYOUT.HEIGHT / 2,
            'PTS',
            STYLES.ptsLabel
        ).setOrigin(1, 0.5);

        const secondaryStatsText = `Stage: ${playerData.maxStage}\nKills: ${playerData.bestKills}`;
        const statsText = scene.add.text(
            ptsLabelText.x - ptsLabelText.width - LAYOUT.STATS_TO_PTS_GAP,
            LAYOUT.HEIGHT / 2,
            secondaryStatsText,
            STYLES.stats
        ).setOrigin(1, 0.5);

        this.add([ptsValueText, ptsLabelText, statsText]);

        const rankText = scene.add.text(
            LAYOUT.PADDING,
            LAYOUT.HEIGHT / 2,
            `#${playerData.rank}`,
            STYLES.rank
        ).setOrigin(0, 0.5);

        const shortAddress = `${playerData.walletAddress.slice(0, 6)}...${playerData.walletAddress.slice(-4)}`;
        const addressDisplayText = isPlayer ? `${shortAddress} (You)` : shortAddress;
        const addressText = scene.add.text(
            rankText.x + rankText.width + LAYOUT.RANK_TO_ADDRESS_GAP,
            LAYOUT.HEIGHT / 2,
            addressDisplayText,
            STYLES.address
        ).setOrigin(0, 0.5);

        if (isPlayer) {
            addressText.setColor('#82d4ff');
        }
        this.add([rankText, addressText]);
    }
}
