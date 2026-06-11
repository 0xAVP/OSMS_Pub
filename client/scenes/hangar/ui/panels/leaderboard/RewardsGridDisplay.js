import Phaser from 'phaser';

const TIER_CONFIG = {
    '#1': {color: 0xFEBA00, size: 55},
    '#2': {color: 0xC029E5, size: 55},
    '#3': {color: 0x41C6FF, size: 55},
    '#4': {color: 0x42DA9D, size: 55},
    'default': {color: 0xe0e0e0, size: 55}
};

const STYLES = {
    rank: {fontFamily: 'Tektur', fontSize: '26px', fontStyle: 'bold'},
    reward: {fontFamily: 'Tektur', fontSize: '16px', color: '#e0e0e0', lineSpacing: 5},
};

function parseRewardString(description) {
    const parts = description.split(':');
    return {rankLabel: parts[0]?.trim() || '', rewardText: parts.slice(1).join(':').trim() || ''};
}

export class RewardsGridDisplay extends Phaser.GameObjects.Container {
    constructor(scene, width, height) {
        super(scene, 0, 0);
        this.panelWidth = width;
        this.panelHeight = height;
        this.dividerX = width * 0.3;
        this.nodes = [];

        this._createGridBase();
    }

    show(rewards) {
        if (!rewards || Object.keys(rewards).length === 0) return;

        const sortedRewards = Object.values(rewards).map(parseRewardString).sort((a, b) => {
            const rankA = parseInt(a.rankLabel.replace('#', ''));
            const rankB = parseInt(b.rankLabel.replace('#', ''));
            return rankA - rankB;
        });

        const rowHeight = (this.panelHeight - 100) / sortedRewards.length;
        sortedRewards.forEach((rewardData, index) => {
            const y = 50 + index * rowHeight;
            const node = this._createNode(rewardData, y);
            this.nodes.push(node);
            this.add(node);
        });
    }

    _createGridBase() {
        const gridBg = this.scene.add.graphics();
        gridBg.lineStyle(1, 0x41C6FF, 0.05);
        for (let i = 0; i < this.panelWidth; i += 20) {
            gridBg.lineBetween(i, 0, i, this.panelHeight);
        }
        for (let i = 0; i < this.panelHeight; i += 20) {
            gridBg.lineBetween(0, i, this.panelWidth, i);
        }

        this.centralBus = this.scene.add.graphics();

        this.centralBus.lineStyle(2, 0x41C6FF, 0.3).lineBetween(this.dividerX, 20, this.dividerX, this.panelHeight - 20);

        this.add([gridBg, this.centralBus]);
    }

    _createNode(rewardData, y) {
        const tier = TIER_CONFIG[rewardData.rankLabel.split(' ')[0]] || TIER_CONFIG.default;
        const rankXOffset = this.dividerX / 2;
        const textXOffset = 20;

        const nodeContainer = this.scene.add.container(0, y);

        const path = this.scene.add.graphics().lineStyle(1, tier.color, 0.4);
        path.lineBetween(rankXOffset, 0, this.dividerX, 0);
        const nodeShape = this.scene.add.graphics();
        const lineThickness = 3;
        nodeShape.lineStyle(lineThickness, tier.color, 0.9);
        const rankFontSize = parseInt(STYLES.rank.fontSize.replace('px', ''));
        const lineYOffset = rankFontSize * 0.85;
        const lineWidth = 45;
        nodeShape.lineBetween(-lineWidth, -lineYOffset, lineWidth, -lineYOffset);
        nodeShape.lineBetween(-lineWidth, lineYOffset, lineWidth, lineYOffset);
        const rankText = this.scene.add.text(0, 0, rewardData.rankLabel, STYLES.rank).setColor(`#${tier.color.toString(16)}`).setOrigin(0.5);
        const rankDisplay = this.scene.add.container(rankXOffset, 0, [nodeShape, rankText]);

        const rewardsContainer = this.scene.add.container(this.dividerX + textXOffset, 0);

        const decoratorWidth = 4;
        const decoratorHeight = 26;
        const decoratorSpacing = 12;

        const decorator = this.scene.add.graphics();
        decorator.fillStyle(tier.color, 0.8).fillRect(0, -decoratorHeight / 2, decoratorWidth, decoratorHeight);

        const textStartX = decoratorWidth + decoratorSpacing;

        const rewardTextWidth = this.panelWidth - (this.dividerX + textXOffset) - textStartX;
        const rewardStyle = {
            ...STYLES.reward,
            wordWrap: {width: rewardTextWidth, useAdvancedWrap: true}
        };
        const rewardLabel = this.scene.add.text(
            textStartX,
            0,
            rewardData.rewardText,
            rewardStyle
        ).setOrigin(0, 0.5);

        rewardsContainer.add([decorator, rewardLabel]);
        nodeContainer.add([path, rankDisplay, rewardsContainer]);

        return nodeContainer;
    }
}