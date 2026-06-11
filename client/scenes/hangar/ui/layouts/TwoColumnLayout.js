import Phaser from 'phaser';

const DEFAULTS = {
    leftColumnWidth: 230,
    rightColumnWidth: 350,
    columnGap: 40,
    height: 560,
};

/**
 * @class TwoColumnLayout
 * @extends Phaser.GameObjects.Container
 * @description
 * Переиспользуемый компонент верстки, который создает двухколоночную структуру
 * с вертикальным разделителем. Предоставляет публичные свойства `leftContainer`
 * и `rightContainer`, в которые можно добавлять любой контент.
 */
export class TwoColumnLayout extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene Сцена Phaser.
     * @param {object} config - Конфигурация верстки.
     * @param {number} config.leftColumnWidth - Ширина левой колонки.
     * @param {number} config.rightColumnWidth - Ширина правой колонки.
     * @param {number} config.columnGap - Отступ между колонками.
     * @param {number} config.height - Общая высота компонента.
     */
    constructor(scene, config = {}) {

        super(scene, 0, 0);

        this.config = {...DEFAULTS, ...config};

        this.leftContainer = scene.add.container(0, 0);

        this.rightContainer = scene.add.container(
            this.config.leftColumnWidth + this.config.columnGap,
            0
        );

        const separatorX = this.config.leftColumnWidth + (this.config.columnGap / 2);
        this.separator = scene.add.graphics()
            .fillStyle(0xffffff, 0.15)
            .fillRect(separatorX, 0, 2, this.config.height);

        this.add([this.leftContainer, this.rightContainer, this.separator]);

        scene.add.existing(this);
    }
}