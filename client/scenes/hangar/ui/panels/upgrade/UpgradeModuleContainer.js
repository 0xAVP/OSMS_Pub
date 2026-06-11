import Phaser from 'phaser';
import {ItemDetailView} from '../inventory/ItemDetailView.js';
import {UpgradeActionView} from './components/UpgradeActionView.js';
import {TwoColumnLayout} from '../../layouts/TwoColumnLayout.js';

const LAYOUT_CONFIG = {
    leftColumnWidth: 230,
    rightColumnWidth: 350,
    columnGap: 40,
    height: 560,
};

export class UpgradeModuleContainer extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, 0, 0);

        this.onAction = config.onAction || (() => Promise.reject(new Error('onAction not provided')));
        this._createUI();
        this._attachEventListeners();
    }

    _createUI() {
        this.layout = new TwoColumnLayout(this.scene, LAYOUT_CONFIG);
        this.detailView = new ItemDetailView(this.scene, LAYOUT_CONFIG.leftColumnWidth);
        this.actionView = new UpgradeActionView(this.scene, {width: LAYOUT_CONFIG.rightColumnWidth});

        this.layout.leftContainer.add(this.detailView);
        this.layout.rightContainer.add(this.actionView);

        this.add(this.layout);
    }

    _attachEventListeners() {
        this.actionView.on('upgrade-click', ({moduleData, quantity}) => {
            const upgradePromise = this.onAction(moduleData, quantity)
                .catch(error => {
                    console.error("UpgradeModuleContainer: Action failed.", error);

                });

            this.actionView.ui.actionButton.trackPromise(upgradePromise);
        });
    }

    setItem(itemData) {
        if (!itemData) {
            this.setVisible(false);
            return;
        }

        this.setVisible(true);
        this.detailView.setItem(itemData);
        this.actionView.setItem(itemData);
    }
}
