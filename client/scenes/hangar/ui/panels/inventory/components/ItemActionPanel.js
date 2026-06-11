import Phaser from 'phaser';
import {ActionButton} from '../../../components/ActionButton.js';

/**
 * @class ItemActionPanel
 * @extends Phaser.GameObjects.Container
 * @description
 * Компонент, отвечающий за отображение и обработку кнопок действий для выбранного предмета
 * в инвентаре (например, "Send" и "Use").
 *
 * Он спроектирован для использования внутри ChildPanel, например, в ItemDetailView.
 *
 * @event send-click - Генерируется при нажатии на кнопку "Send". Передает объект предмета.
 * @event use-click - Генерируется при нажатии на кнопку "Use". Передает объект предмета.
 */
export class ItemActionPanel extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene Сцена Phaser.
     * @param {number} x Позиция X.
     * @param {number} y Позиция Y.
     */
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        /**
         * @private
         * @type {object|null}
         */
        this.currentItem = null;

        this._createUI();

        this._attachEventListeners();

        this.setVisible(false);

        scene.add.existing(this);
    }

    /**
     * Создает визуальные элементы (кнопки).
     * @private
     */
    _createUI() {
        this.sendButton = new ActionButton(this.scene, {
            texture: 'send',
            scale: 0.75,
            cooldown: 500
        });

        this.useButton = new ActionButton(this.scene, {
            texture: 'use',
            scale: 0.75,
            cooldown: 2000
        });

        this.add([this.sendButton, this.useButton]);
    }

    /**
     * Привязывает обработчики событий к кнопкам.
     * @private
     */
    _attachEventListeners() {
        this.sendButton.on('click', () => {
            if (this.currentItem) {

                this.emit('send-click', this.currentItem);
            }
        });

        this.useButton.on('click', () => {
            if (this.currentItem) {

                this.emit('use-click', this.currentItem);
            }
        });
    }

    /**
     * Обновляет состояние панели на основе данных выбранного предмета.
     * @param {object|null} itemData - Объект данных предмета или null для сброса.
     */
    update(itemData) {
        this.currentItem = itemData;

        if (!itemData || !itemData.attributes) {
            this.setVisible(false);
            return;
        }

        const {isTradable = false, isUsable = false} = itemData.attributes;

        this.sendButton.setVisible(isTradable);
        this.useButton.setVisible(isUsable);

        this._updateLayout(isTradable, isUsable);

        this.setVisible(isTradable || isUsable);
    }

    /**
     * Корректно располагает кнопки в зависимости от их видимости.
     * @param {boolean} showSend - Видима ли кнопка "Send".
     * @param {boolean} showUse - Видима ли кнопка "Use".
     * @private
     */
    _updateLayout(showSend, showUse) {
        const BUTTON_SPACING = 130;

        if (showSend && showUse) {

            this.sendButton.setX(-BUTTON_SPACING / 2);
            this.useButton.setX(BUTTON_SPACING / 2);
        } else if (showSend) {

            this.sendButton.setX(0);
        } else if (showUse) {

            this.useButton.setX(0);
        }
    }
}