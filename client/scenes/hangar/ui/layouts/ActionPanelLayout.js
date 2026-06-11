import Phaser from 'phaser';

const DEFAULTS = {
    height: 560,
    actionAreaHeight: 100,
};

/**
 * @class ActionPanelLayout
 * @extends Phaser.GameObjects.Container
 * @description
 * Компонент-верстка, который располагает основной контент вверху
 * и блок с действиями внизу в пределах заданной высоты.
 */
export class ActionPanelLayout extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene Сцена Phaser.
     * @param {object} config - Конфигурация.
     * @param {Phaser.GameObjects.Container} config.mainContent - Контейнер с основным контентом.
     * @param {Phaser.GameObjects.Container} config.actionContent - Контейнер с кнопками/действиями.
     * @param {number} config.height - Общая высота.
     * @param {number} config.actionAreaHeight - Высота нижней области.
     */
    constructor(scene, config) {
        super(scene, 0, 0);
        const finalConfig = {...DEFAULTS, ...config};

        const {mainContent, actionContent, height, actionAreaHeight} = finalConfig;

        if (mainContent) {
            mainContent.setPosition(0, 0);
            this.add(mainContent);
        }

        if (actionContent) {

            const actionContentWidth = actionContent.getBounds().width;
            const parentWidth = config.width || 0;
            const actionX = (parentWidth - actionContentWidth) / 2;

            actionContent.setPosition(actionX, height - actionAreaHeight);
            this.add(actionContent);
        }

        scene.add.existing(this);
    }
}