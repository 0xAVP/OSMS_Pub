import Phaser from 'phaser';
import {ItemDetailView} from './ItemDetailView.js';
import {ItemActionPanel} from './components/ItemActionPanel.js';
import {useItem} from '../../processing/useItemHandler.js';

const LAYOUT = {
    BOTTOM_GAP: 10,
};

/**
 * @class ItemDetailContainer
 * @extends Phaser.GameObjects.Container
 */
export class ItemDetailContainer extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene Сцена Phaser.
     * @param {object} config - Конфигурация.
     * @param {number} config.width - Ширина доступной области.
     * @param {number} config.height - Высота доступной области.
     */
    constructor(scene, config) {
        super(scene, 0, 0);

        this.panelWidth = config.width;
        this.panelHeight = config.height;

        this._createUI();
        this._attachActionListeners();
    }

    _createUI() {
        this.detailView = new ItemDetailView(this.scene);
        this.actionPanel = new ItemActionPanel(this.scene);

        this.add([this.detailView, this.actionPanel]);

        const FIXED_BUTTON_Y = this.panelHeight - 20;

        this.actionPanel.setPosition(this.panelWidth / 2, FIXED_BUTTON_Y);

        this.detailView.setPosition(0, 0);
    }

    _attachActionListeners() {
        this.actionPanel.on('use-click', (itemData) => {
            const usePromise = useItem(this.scene, itemData)
                .catch(error => {
                    console.error(`ItemDetailContainer: Failed to use item.`, error);
                });
            this.actionPanel.useButton.trackPromise(usePromise);
        });

        this.actionPanel.on('send-click', (itemData) => {
            const openPanelPromise = Promise.resolve();
            this.actionPanel.sendButton.trackPromise(openPanelPromise);
            this.emit('open-send-panel', itemData);
        });
    }

    setItem(itemData) {
        if (!itemData) {
            this.setVisible(false);
            return;
        }

        this.setVisible(true);

        this.detailView.setItem(itemData);

        this.actionPanel.update(itemData);

    }
}