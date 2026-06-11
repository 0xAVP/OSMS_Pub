import Phaser from 'phaser';
import {ClassificationPanel} from './components/ClassificationPanel.js';
import {ShipProjection} from './components/ShipProjection.js';
import {SpecificationsPanel} from './components/SpecificationsPanel.js';

const LAYOUT = {
    MODAL_WIDTH: 1600,
    MODAL_HEIGHT: 800,
    CORNER_RADIUS: 15,
    PADDING: 40,
    CLOSE_BUTTON_OFFSET: 25,
    TITLE_Y_OFFSET: -360,
    LEFT_COLUMN_X: -550,
    CENTER_COLUMN_X: 0,
    RIGHT_COLUMN_X: 550,
};

const STYLES = {
    BG_COLOR: 0x1A1325,
    BG_ALPHA: 0.92,
    BORDER_COLOR: 0x41C6FF,
    BORDER_ALPHA: 0.5,
    TITLE: {fontFamily: 'Tektur', fontSize: '32px', color: '#FFFFFF'},
};

export class MintShipView extends Phaser.GameObjects.Container {
    constructor(scene, availableShips) {
        super(scene, 0, 0);
        this.availableShips = availableShips;
        this.currentPage = 0;
        this.isMinting = false;

        this._createUI();
    }

    _createUI() {
        const bg = this.scene.add.graphics();
        bg.fillStyle(STYLES.BG_COLOR, STYLES.BG_ALPHA)
            .fillRoundedRect(-LAYOUT.MODAL_WIDTH / 2, -LAYOUT.MODAL_HEIGHT / 2, LAYOUT.MODAL_WIDTH, LAYOUT.MODAL_HEIGHT, LAYOUT.CORNER_RADIUS);
        bg.lineStyle(2, STYLES.BORDER_COLOR, STYLES.BORDER_ALPHA)
            .strokeRoundedRect(-LAYOUT.MODAL_WIDTH / 2, -LAYOUT.MODAL_HEIGHT / 2, LAYOUT.MODAL_WIDTH, LAYOUT.MODAL_HEIGHT, LAYOUT.CORNER_RADIUS);
        this.add(bg);

        this.titleText = this.scene.add.text(0, LAYOUT.TITLE_Y_OFFSET, 'SHIP CONSTRUCTION', STYLES.TITLE).setOrigin(0.5);
        this.add(this.titleText);

        const titleUnderline = this.scene.add.graphics({y: this.titleText.y + 30});
        titleUnderline.fillStyle(STYLES.BORDER_COLOR, 0.3).fillRect(-400, 0, 800, 2);
        this.add(titleUnderline);

        const closeButton = this.scene.add.image(LAYOUT.MODAL_WIDTH / 2 - LAYOUT.CLOSE_BUTTON_OFFSET, -LAYOUT.MODAL_HEIGHT / 2 + LAYOUT.CLOSE_BUTTON_OFFSET, 'close_btn')
            .setInteractive({useHandCursor: true});
        closeButton.on('pointerdown', () => this.emit('close-modal'));
        this.add(closeButton);

        this.classificationPanel = new ClassificationPanel(this.scene);
        this.shipProjection = new ShipProjection(this.scene);
        this.specificationsPanel = new SpecificationsPanel(this.scene);

        this.classificationPanel.setPosition(LAYOUT.LEFT_COLUMN_X, 50);
        this.shipProjection.setPosition(LAYOUT.CENTER_COLUMN_X, 50);
        this.specificationsPanel.setPosition(LAYOUT.RIGHT_COLUMN_X, 50);

        this.add([this.classificationPanel, this.shipProjection, this.specificationsPanel]);

        this.shipProjection.on('prev-page', () => this._changePage(-1));
        this.shipProjection.on('next-page', () => this._changePage(1));

        this.classificationPanel.on('mint-clicked', () => {
            if (this.isMinting) return;
            this.emit('mint-ship', this.availableShips[this.currentPage]);
        });

        this._renderPage();
    }

    _changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 0 && newPage < this.availableShips.length) {
            this.currentPage = newPage;
            this._renderPage();
        }
    }

    _renderPage() {
        const shipData = this.availableShips[this.currentPage];

        this.titleText.setText(`SHIP CONSTRUCTION - ${shipData.name.toUpperCase()}`);

        this.classificationPanel.update(shipData, this.isMinting);
        this.shipProjection.update(shipData, this.currentPage, this.availableShips.length);
        this.specificationsPanel.update(shipData);
    }

    setMintingState(isMinting) {
        this.isMinting = isMinting;
        this._renderPage();
    }
}