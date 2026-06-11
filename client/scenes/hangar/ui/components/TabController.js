import Phaser from 'phaser';

const DEFAULTS = {
    x: 0,
    y: 0,
    tabWidth: 120,
    tabHeight: 40,
    gap: 2,
};

const STYLES = {
    font: {fontFamily: 'Tektur', fontSize: '16px'},

    color_active: '#ffffff',
    color_inactive: '#8899a6',
    color_hover: '#d0dbe8',

    bg_color_active: 0x323842,
    bg_color_inactive: 0x1e2126,
    bg_color_hover: 0x2a2f38,

    accent_color: 0xFEBA00,
    border_radius: {tl: 6, tr: 6, bl: 0, br: 0}
};

/**
 * @class TabController
 * @extends Phaser.GameObjects.Container
 * @description Управляет группой вкладок и генерирует событие при выборе новой.
 */
export class TabController extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, finalConfig.x, finalConfig.y);

        this.config = finalConfig;
        this.tabs = [];
        this.activeTabId = null;

        this._createBaseLine();
        this._createTabs();

        scene.add.existing(this);
    }

    _createBaseLine() {
        const {tabs, tabWidth, gap} = this.config;
        if (!tabs || tabs.length === 0) return;

        const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * gap;
        const lineY = this.config.tabHeight / 2;

        const baseLine = this.scene.add.rectangle(0, lineY, totalWidth, 2, 0x323842);
        this.add(baseLine);
    }

    _createTabs() {
        const {tabs, tabWidth, tabHeight, gap} = this.config;
        if (!tabs || tabs.length === 0) return;

        const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * gap;
        let currentX = -totalWidth / 2 + tabWidth / 2;

        tabs.forEach(tabConfig => {
            const tabContainer = this.scene.add.container(currentX, 0);

            const bg = this.scene.add.graphics();

            const text = this.scene.add.text(0, 0, tabConfig.label.toUpperCase(), STYLES.font).setOrigin(0.5);

            const accentLine = this.scene.add.rectangle(0, tabHeight / 2 - 1, tabWidth, 3, STYLES.accent_color).setVisible(false);

            tabContainer.add([bg, accentLine, text]);

            tabContainer.setSize(tabWidth, tabHeight).setInteractive({useHandCursor: true});

            tabContainer.on('pointerdown', () => this.setActiveTab(tabConfig.id));

            tabContainer.on('pointerover', () => {
                if (this.activeTabId !== tabConfig.id) {
                    this._updateTabVisuals(tabObj, 'hover');
                }
            });
            tabContainer.on('pointerout', () => {
                if (this.activeTabId !== tabConfig.id) {
                    this._updateTabVisuals(tabObj, 'inactive');
                }
            });

            const tabObj = {
                id: tabConfig.id,
                container: tabContainer,
                bg: bg,
                text: text,
                accentLine: accentLine
            };

            this.tabs.push(tabObj);
            this.add(tabContainer);

            this._updateTabVisuals(tabObj, 'inactive');

            currentX += tabWidth + gap;
        });

        if (this.config.defaultTab) {
            this.setActiveTab(this.config.defaultTab);
        } else if (tabs[0]) {
            this.setActiveTab(tabs[0].id);
        }
    }

    /**
     * Внутренний метод для отрисовки состояния одной вкладки
     */
    _updateTabVisuals(tab, state) {
        const {tabWidth, tabHeight} = this.config;
        const bg = tab.bg;
        const text = tab.text;
        const accent = tab.accentLine;

        bg.clear();

        if (state === 'active') {

            bg.fillStyle(STYLES.bg_color_active, 1);
            bg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, STYLES.border_radius);

            text.setColor(STYLES.color_active);
            accent.setVisible(true);

            text.setY(-2);
        } else if (state === 'hover') {

            bg.fillStyle(STYLES.bg_color_hover, 1);

            bg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2 + 4, tabWidth, tabHeight - 4, STYLES.border_radius);

            text.setColor(STYLES.color_hover);
            accent.setVisible(false);
            text.setY(2);
        } else {

            bg.fillStyle(STYLES.bg_color_inactive, 1);
            bg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2 + 4, tabWidth, tabHeight - 4, STYLES.border_radius);

            text.setColor(STYLES.color_inactive);
            accent.setVisible(false);
            text.setY(2);
        }
    }

    /**
     * Устанавливает активную вкладку.
     * @param {string} id - Идентификатор вкладки для активации.
     */
    setActiveTab(id) {

        const changed = this.activeTabId !== id;
        this.activeTabId = id;

        this.tabs.forEach(tab => {
            if (tab.id === id) {
                this._updateTabVisuals(tab, 'active');
            } else {
                this._updateTabVisuals(tab, 'inactive');
            }
        });

        if (changed) {
            this.emit('tab-selected', id);
        }
    }
}

