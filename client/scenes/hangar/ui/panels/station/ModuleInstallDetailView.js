import Phaser from 'phaser';
import {ItemDetailView} from '../inventory/ItemDetailView.js';
import {ActionButton} from '../../components/ActionButton.js';

const LAYOUT = {
    BOTTOM_GAP: 10,
};

/**
 * @class ModuleInstallDetailView
 * @extends Phaser.GameObjects.Container
 * @description
 * Показывает детали модуля и кнопку "Install".
 * Предназначен для использования в ChildPanel внутри ReplaceModulePanel.
 * @event install-click - Генерируется при нажатии на кнопку "Install".
 */
export class ModuleInstallDetailView extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, 0, 0);

        this.panelWidth = config.width;
        this.panelHeight = config.height;
        this.itemData = null;

        this._createUI();
    }

    _createUI() {
        this.detailView = new ItemDetailView(this.scene);
        this.installButton = new ActionButton(this.scene, {
            texture: 'install',
            scale: 0.8,
            cooldown: 2000
        });

        this.installButton.on('click', () => {
            if (this.itemData) {
                this.emit('install-click', this.itemData);
            }
        });

        this.add([this.detailView, this.installButton]);
    }

    setItem(itemData) {
        this.itemData = itemData;
        if (!itemData) {
            this.setVisible(false);
            return;
        }

        this.setVisible(true);
        this.detailView.setItem(itemData);
        this._updateLayout();
    }

    _updateLayout() {
        this.detailView.setPosition(0, 0);

        const buttonBounds = this.installButton.getBounds();
        const buttonY = this.panelHeight - (buttonBounds.height / 2) - LAYOUT.BOTTOM_GAP;

        this.installButton.setPosition(this.panelWidth / 2, buttonY);
    }

}
