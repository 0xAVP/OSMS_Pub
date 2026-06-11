import {BaseModal} from '../../components/BaseModal.js';
import {HistoryItem} from './HistoryItem.js';
import {HistoryNavigation} from './HistoryNavigation.js';
import {webSocketManager} from '../../../WebSocketManager.js';

const BASE_DESIGN_WIDTH = 1920;
const BASE_DESIGN_HEIGHT = 1080;

const CONFIG = {
    width: 600,
    height: 600,
    itemsPerPage: 5,
    itemHeight: 70,
    itemGap: 10,
    POS: {
        TITLE_Y: -260,
        NAV_Y: -200,
        LIST_START_Y: -170,
        PAGINATION_Y: 260
    },
    STYLE: {
        BG_COLOR: 0x1A1325,
        BG_ALPHA: 0.92,
        BORDER_COLOR: 0x41C6FF,
        BORDER_ALPHA: 0.5,
        BORDER_WIDTH: 2,
        CORNER_RADIUS: 15
    }
};

export class TransactionHistoryModal extends BaseModal {
    constructor(scene, data) {
        const content = scene.add.container(0, 0);
        super(scene, content);

        this.tooltip = this.scene.tooltip;
        if (this.tooltip) {
            this.originalTooltipDepth = this.tooltip.depth;
            this.tooltip.setDepth(this.depth + 10);
        }

        if (this.scene.sysMessageContainer) {
            this.originalSysMessageDepth = this.scene.sysMessageContainer.depth;
            this.scene.sysMessageContainer.setDepth(this.depth + 10);
        }

        this.currentCategory = data?.filter || 'tokens';
        this.currentPage = 0;
        this.items = [];
        this.cache = {};

        this._buildUI();

        this.navigation.currentTab = this.currentCategory;
        this.navigation.updateTabVisuals();

        this._fetchData(false);

        this.onTxHistoryUpdate = () => {
            console.log('TransactionHistoryModal: Event received. Invalidating cache & refreshing...');
            this.cache = {};
            if (this.active) {
                this._fetchData(true);
            }
        };

        this.scene.events.on('tx-history-updated', this.onTxHistoryUpdate, this);

        this.on('destroy', () => {
            this.scene.events.off('tx-history-updated', this.onTxHistoryUpdate, this);
            this.cache = null;

            if (this.scene && this.scene.sysMessageContainer) {
                this.scene.sysMessageContainer.setDepth(this.originalSysMessageDepth);
            }
            if (this.tooltip) {
                this.tooltip.setDepth(this.originalTooltipDepth);
            }

        });

        this.centerContent();
        this.show();
    }

    /**
     * ПЕРЕОПРЕДЕЛЕНИЕ МЕТОДА РОДИТЕЛЯ (BaseModal)
     * Обеспечивает адаптивность под любые разрешения экранов.
     */
    centerContent() {
        const widthRatio = this.scene.scale.width / BASE_DESIGN_WIDTH;
        const heightRatio = this.scene.scale.height / BASE_DESIGN_HEIGHT;

        let scaleFactor = Math.min(widthRatio, heightRatio);

        this.content.setScale(scaleFactor);
        this.content.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
    }

    _buildUI() {
        const halfW = CONFIG.width / 2;
        const halfH = CONFIG.height / 2;

        const bg = this.scene.add.graphics();
        bg.fillStyle(CONFIG.STYLE.BG_COLOR, CONFIG.STYLE.BG_ALPHA);
        bg.fillRoundedRect(-halfW, -halfH, CONFIG.width, CONFIG.height, CONFIG.STYLE.CORNER_RADIUS);
        bg.lineStyle(CONFIG.STYLE.BORDER_WIDTH, CONFIG.STYLE.BORDER_COLOR, CONFIG.STYLE.BORDER_ALPHA);
        bg.strokeRoundedRect(-halfW, -halfH, CONFIG.width, CONFIG.height, CONFIG.STYLE.CORNER_RADIUS);
        this.content.add(bg);

        const title = this.scene.add.text(0, CONFIG.POS.TITLE_Y, 'TRANSACTION HISTORY', {
            fontFamily: 'Tektur', fontSize: '24px', color: '#41C6FF', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.content.add(title);

        const indicatorX = (title.width / 2) + 20;
        const indicatorContainer = this.scene.add.container(indicatorX, CONFIG.POS.TITLE_Y);

        this.liveIndicatorDot = this.scene.add.circle(0, 0, 4, 0x42DA9D);

        const liveText = this.scene.add.text(10, 0, 'LIVE', {
            fontFamily: 'Tektur',
            fontSize: '10px',
            color: '#42DA9D',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        indicatorContainer.add([this.liveIndicatorDot, liveText]);
        this.content.add(indicatorContainer);

        this.scene.tweens.add({
            targets: this.liveIndicatorDot,
            alpha: {from: 1, to: 0.2},
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.navigation = new HistoryNavigation(
            this.scene,
            CONFIG.width,
            CONFIG.height,
            (tab) => this._changeTab(tab),
            (delta) => this._changePage(delta)
        );
        this.navigation.setPosition(0, CONFIG.POS.NAV_Y);
        this.content.add(this.navigation);

        this.listContainer = this.scene.add.container(0, 0);
        this.content.add(this.listContainer);

        this.statusText = this.scene.add.text(0, 0, 'Loading...', {
            fontFamily: 'Tektur', fontSize: '18px', color: '#888888'
        }).setOrigin(0.5);
        this.content.add(this.statusText);

        const closeOffset = 25;
        const closeBtn = this.scene.add.image(
            halfW - closeOffset,
            -halfH + closeOffset,
            'close_btn'
        ).setInteractive({useHandCursor: true});

        closeBtn.on('pointerdown', () => this.hide());
        this.content.add(closeBtn);
    }

    _changeTab(category) {
        if (this.currentCategory === category) return;
        this.currentCategory = category;
        this.currentPage = 0;
        this._fetchData(false);
    }

    _changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage < 0) return;

        if (delta > 0 && this.items.length < CONFIG.itemsPerPage) return;

        this.currentPage = newPage;
        this._fetchData(false);
    }

    async _fetchData(forceRefresh = false) {

        if (!forceRefresh && this.cache[this.currentCategory] && this.cache[this.currentCategory][this.currentPage]) {
            console.log(`[Cache Hit] Category: ${this.currentCategory}, Page: ${this.currentPage}`);
            const cachedData = this.cache[this.currentCategory][this.currentPage];
            this.items = cachedData.items;

            this.listContainer.removeAll(true);
            this.statusText.setVisible(false);
            this._renderItems();
            this.navigation.updatePagination(this.currentPage, cachedData.hasNextPage);
            return;
        }

        if (!forceRefresh) {
            this.listContainer.removeAll(true);
            this.statusText.setVisible(true).setText('Loading...');
        }

        this.navigation.updatePagination(this.currentPage, false);

        try {
            const offset = this.currentPage * CONFIG.itemsPerPage;

            const response = await webSocketManager.sendMessage('get-transaction-history', {
                category: this.currentCategory,
                limit: CONFIG.itemsPerPage + 1,
                offset: offset
            });

            if (!this.active) return;

            if (!response || !response.history) throw new Error('No data');

            const history = response.history;
            const hasNextPage = history.length > CONFIG.itemsPerPage;
            const items = hasNextPage ? history.slice(0, CONFIG.itemsPerPage) : history;

            this.items = items;

            if (!this.cache[this.currentCategory]) {
                this.cache[this.currentCategory] = {};
            }
            this.cache[this.currentCategory][this.currentPage] = {
                items: items,
                hasNextPage: hasNextPage
            };

            this.listContainer.removeAll(true);
            this._renderItems();
            this.navigation.updatePagination(this.currentPage, hasNextPage);

        } catch (error) {
            console.error('History fetch error:', error);
            if (!this.active) return;

            if (!forceRefresh) {
                this.listContainer.removeAll(true);
                this.statusText.setVisible(true).setText('Failed to load history.');
            }
        }
    }

    _renderItems() {
        if (this.items.length === 0) {
            this.statusText.setVisible(true).setText('No transactions found.');
            return;
        }
        this.statusText.setVisible(false);

        let currentY = CONFIG.POS.LIST_START_Y;
        const startX = -CONFIG.width / 2 + 30;
        const itemWidth = CONFIG.width - 60;

        this.items.forEach((tx) => {
            const item = new HistoryItem(
                this.scene,
                startX,
                currentY,
                itemWidth,
                CONFIG.itemHeight,
                tx
            );

            this.listContainer.add(item);
            currentY += CONFIG.itemHeight + CONFIG.itemGap;
        });
    }
}