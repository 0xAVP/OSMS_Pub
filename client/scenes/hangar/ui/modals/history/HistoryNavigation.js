import Phaser from 'phaser';

const STYLES = {
    tabActive: {fontFamily: 'Tektur', fontSize: '18px', color: '#FEBA00', fontStyle: 'bold'},
    tabInactive: {fontFamily: 'Tektur', fontSize: '18px', color: '#888888'},
    pageText: {fontFamily: 'Tektur', fontSize: '18px', color: '#ffffff'}
};

export class HistoryNavigation extends Phaser.GameObjects.Container {
    constructor(scene, width, modalHeight, onTabChange, onPageChange) {
        super(scene, 0, 0);
        this.width = width;
        this.modalHeight = modalHeight;
        this.onTabChange = onTabChange;
        this.onPageChange = onPageChange;

        this.currentTab = 'tokens';

        this._createTabs();
        this._createPagination();
    }

    _createTabs() {

        const lineY = 20;
        const bg = this.scene.add.graphics();
        bg.lineStyle(1, 0x41C6FF, 0.3);
        bg.lineBetween(-this.width / 2 + 30, lineY, this.width / 2 - 30, lineY);
        this.add(bg);

        this.tokensBtn = this._createTabBtn('TOKENS', -80, 0, 'tokens');
        this.shipsBtn = this._createTabBtn('SHIPS', 80, 0, 'ships');

        this.indicator = this.scene.add.rectangle(-80, lineY, 100, 2, 0xFEBA00);
        this.add(this.indicator);
    }

    _createTabBtn(text, x, y, key) {
        const btn = this.scene.add.text(x, y, text, STYLES.tabInactive)
            .setOrigin(0.5)
            .setInteractive({useHandCursor: true});

        btn.on('pointerdown', () => {
            if (this.currentTab !== key) {
                this.currentTab = key;
                this.updateTabVisuals();
                this.onTabChange(key);
            }
        });
        this.add(btn);
        return btn;
    }

    updateTabVisuals() {
        this.tokensBtn.setStyle(this.currentTab === 'tokens' ? STYLES.tabActive : STYLES.tabInactive);
        this.shipsBtn.setStyle(this.currentTab === 'ships' ? STYLES.tabActive : STYLES.tabInactive);

        const targetX = this.currentTab === 'tokens' ? this.tokensBtn.x : this.shipsBtn.x;
        this.scene.tweens.add({
            targets: this.indicator,
            x: targetX,
            duration: 200,
            ease: 'Sine.easeOut'
        });
    }

    _createPagination() {

        const paginationY = 460;

        this.prevBtn = this.scene.add.image(-60, paginationY, 'arrowL').setInteractive({useHandCursor: true}).setScale(1.5);
        this.nextBtn = this.scene.add.image(60, paginationY, 'arrowR').setInteractive({useHandCursor: true}).setScale(1.5);
        this.pageText = this.scene.add.text(0, paginationY, '1', STYLES.pageText).setOrigin(0.5);

        this.prevBtn.on('pointerdown', () => this.onPageChange(-1));
        this.nextBtn.on('pointerdown', () => this.onPageChange(1));

        this.add([this.prevBtn, this.nextBtn, this.pageText]);
    }

    updatePagination(currentPage, hasNextPage) {
        this.pageText.setText(`${currentPage + 1}`);
        this.prevBtn.setAlpha(currentPage > 0 ? 1 : 0.3);

        this.nextBtn.setAlpha(hasNextPage ? 1 : 0.3);
    }
}