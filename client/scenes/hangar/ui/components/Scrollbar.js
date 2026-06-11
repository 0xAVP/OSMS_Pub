import Phaser from 'phaser';

const DEFAULTS = {
    x: 0,
    y: 0,
    width: 10,
    height: 400,
    thumbWidth: 30,
    thumbTexture: 'slider_thumb',
    trackColor: 0xD9D9D9,
    trackAlpha: 0.5,
};

/**
 * @class Scrollbar
 * @extends Phaser.GameObjects.Container
 * @description Переиспользуемый компонент вертикального скроллбара.
 * Генерирует событие 'scroll' с прогрессом (0-1) при перетаскивании.
 */
export class Scrollbar extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, finalConfig.x, finalConfig.y);

        this.config = finalConfig;
        this.thumbRadius = this.config.thumbWidth / 2;
        this.minY = this.thumbRadius;
        this.maxY = this.config.height - this.thumbRadius;
        this.travelRange = this.maxY - this.minY;

        this._createUI();
        this._setupInputHandlers();

        scene.add.existing(this);
    }

    _createUI() {
        this.track = this.scene.add.graphics()
            .fillStyle(this.config.trackColor, this.config.trackAlpha)
            .fillRoundedRect(0, 0, this.config.width, this.config.height, this.config.width / 2);

        this.thumb = this.scene.add.image(this.config.width / 2, this.minY, this.config.thumbTexture)
            .setInteractive({draggable: true});

        this.add([this.track, this.thumb]);
    }

    _setupInputHandlers() {
        this.thumb.on('drag', (pointer, dragX, dragY) => {
            this.thumb.y = Phaser.Math.Clamp(dragY, this.minY, this.maxY);
            const progress = (this.thumb.y - this.minY) / this.travelRange;
            this.emit('scroll', progress);
        });
    }

    /**
     * Обновляет визуальное положение ползунка на основе прогресса прокрутки.
     * @param {number} progress - Значение от 0 (верх) до 1 (низ).
     */
    updateThumb(progress) {
        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        this.thumb.y = this.minY + clampedProgress * this.travelRange;
    }

    /**
     * Изменяет высоту скроллбара и пересчитывает его внутренние параметры.
     * @param {number} newHeight - Новая высота.
     */
    resize(newHeight) {
        if (this.config.height === newHeight) return;

        this.config.height = newHeight;
        this.maxY = newHeight - this.thumbRadius;
        this.travelRange = this.maxY - this.minY;

        this.track.clear()
            .fillStyle(this.config.trackColor, this.config.trackAlpha)
            .fillRoundedRect(0, 0, this.config.width, newHeight, this.config.width / 2);
    }

    /**
     * Управляет состоянием скроллбара (активен/неактивен).
     * @param {boolean} isScrollable - True, если контент можно прокручивать.
     */
    setVisibleState(isScrollable) {

        this.setVisible(true);

        if (isScrollable) {

            this.setAlpha(1.0);
            this.thumb.setInteractive({draggable: true});
        } else {

            this.setAlpha(0.4);
            this.thumb.disableInteractive();
        }

    }
}