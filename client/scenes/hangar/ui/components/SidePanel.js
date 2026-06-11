import Phaser from 'phaser';

export const DEFAULTS = {
    width: 350,
    height: null,
    title: 'Panel',
    position: 'left',
    alignX: 'left',
    handleSize: 0,
    offsetX: 0,
    padding: 20,
    titleHeight: 50,
    headerIconSizeWidth: 20,
    headerIconSizeHeight: 23,
};

const STYLES = {
    bgColor: 0x1A1325,
    bgAlpha: 0.85,
    headerBgColor: 0x2a2c34,
    headerBgAlpha: 0.99,
    handleBgColor: 0x2a2c34,
    title: {
        fontFamily: 'Tektur',
        fontSize: '20px',
        color: '#ffffff',
    }
};

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

export class SidePanel extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};

        let initialX, initialY;
        switch (finalConfig.position) {
            case 'top':
                initialX = 0;
                initialY = -(finalConfig.height || scene.scale.height);
                break;
            case 'right':
                initialX = scene.scale.width;
                initialY = 0;
                break;
            case 'bottom':
                initialX = 0;
                initialY = scene.scale.height;
                break;
            default:
                initialX = -finalConfig.width;
                initialY = 0;
                break;
        }
        super(scene, initialX, initialY);

        this.setVisible(false);
        this.id = finalConfig.id;
        this.panelWidth = finalConfig.width;
        this.panelHeight = finalConfig.height;
        this.content = finalConfig.content;
        this.config = finalConfig;
        this.setDepth(400);
        this.isExpanded = false;

        this._createUI();

        const panelHitArea = new Phaser.Geom.Rectangle(0, 0, this.panelWidth, this.panelHeight || scene.scale.height);
        this.setInteractive(panelHitArea, Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', (p, x, y, e) => e.stopPropagation());

        if (this.config.handleSize > 0) {
            const handleHeight = this.config.handleSize;
            const handleY = (this.panelHeight || scene.scale.height) - handleHeight;
            this.handleArea = scene.add.zone(0, handleY, this.panelWidth, handleHeight)
                .setOrigin(0)
                .setInteractive({useHandCursor: true})
                .on('pointerdown', this.toggleExpand, this);
            this.add(this.handleArea);
        }

        scene.add.existing(this);

        this.resizeHandler = (data) => {
            if (this.scene) {
                this._handleResize(data);
            }
        };

        scene.events.on('ui-resize', this.resizeHandler);

        const initialData = this.config.initialSizeData || {
            width: scene.scale.width,
            height: scene.scale.height,
            availablePanelHeight: scene.scale.height
        };
        this._handleResize(initialData);
    }

    /**
     * Рисует составной фон панели (заголовок, контент, ручка).
     */
    _drawBackground(graphics, width, height) {
        graphics.clear();

        const {titleHeight, handleSize} = this.config;

        graphics.fillStyle(STYLES.headerBgColor, STYLES.headerBgAlpha);
        graphics.fillRect(0, 0, width, titleHeight);

        if (handleSize > 0) {
            const contentHeight = height - titleHeight - handleSize;
            const handleY = titleHeight + contentHeight;
            graphics.fillStyle(STYLES.bgColor, STYLES.bgAlpha);
            graphics.fillRect(0, titleHeight, width, contentHeight);
            graphics.fillStyle(STYLES.handleBgColor, STYLES.bgAlpha);
            graphics.fillRect(0, handleY, width, handleSize);
        } else {
            const contentHeight = height - titleHeight;
            graphics.fillStyle(STYLES.bgColor, STYLES.bgAlpha);
            graphics.fillRect(0, titleHeight, width, contentHeight);
        }
    }

    /**
     * Создает все дочерние UI элементы панели.
     */
    _createUI() {
        const bg = this.scene.add.graphics();
        const initialHeight = this.panelHeight || this.scene.scale.height;
        this._drawBackground(bg, this.panelWidth, initialHeight);
        this.add(bg);
        this.background = bg;

        const {padding, titleHeight, headerIconSizeWidth, headerIconSizeHeight, position} = this.config;

        const title = this.scene.add.text(0, 0, this.config.title, STYLES.title);
        const arrowTexture = (position === 'right') ? 'panel_arrowR' : 'panel_arrowL';
        const closeIcon = this.scene.add.image(0, 0, arrowTexture)
            .setDisplaySize(headerIconSizeWidth, headerIconSizeHeight);

        if (position === 'right') {
            closeIcon.setPosition(padding, titleHeight / 2).setOrigin(0, 0.5);
            title.setPosition(this.panelWidth - padding, titleHeight / 2).setOrigin(1, 0.5);
        } else {
            title.setPosition(padding, titleHeight / 2).setOrigin(0, 0.5);
            closeIcon.setPosition(this.panelWidth - padding, titleHeight / 2).setOrigin(1, 0.5);
        }

        this.add(title);
        this.add(closeIcon);

        const headerZone = this.scene.add.zone(0, 0, this.panelWidth, titleHeight)
            .setOrigin(0, 0)
            .setInteractive({useHandCursor: true});

        headerZone.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.emit('close-side-panel-request', this.id);
        });

        this.add(headerZone);

        if (this.config.handleSize > 0) {
            title.setVisible(false);
            closeIcon.setVisible(false);
            headerZone.setVisible(false);
        }

        if (this.content) {
            this.content.setPosition(0, 0);
            this.add(this.content);
        }
    }

    /**
     * Обрабатывает изменение размеров окна, масштабирует и позиционирует панель.
     * @param {object} data - Объект с размерами: { width, height, availablePanelHeight }.
     */
    _handleResize(data) {
        if (!this.scene || !this.scene.scale) return;

        const {width: sceneWidth, height: sceneHeight, availablePanelHeight} = data;

        const scaleX = sceneWidth / BASE_WIDTH;
        const scaleY = sceneHeight / BASE_HEIGHT;
        const scaleFactor = Math.min(scaleX, scaleY);
        this.setScale(scaleFactor);

        let currentPanelHeight = this.config.height;
        if (currentPanelHeight === null) {
            currentPanelHeight = sceneHeight / scaleFactor;
            this._drawBackground(this.background, this.panelWidth, currentPanelHeight);
        }

        if (this.input && this.input.hitArea) {
            this.input.hitArea.setSize(this.panelWidth, currentPanelHeight);
        }

        const scaledPanelWidth = this.panelWidth * scaleFactor;
        const scaledPanelHeight = currentPanelHeight * scaleFactor;
        const scaledHandleSize = this.config.handleSize * scaleFactor;

        if (this.visible) {
            switch (this.config.position) {
                case 'top':
                    this.y = this.isExpanded ? 0 : -scaledPanelHeight + scaledHandleSize;
                    switch (this.config.alignX) {
                        case 'center':
                            this.x = (sceneWidth - scaledPanelWidth) / 2;
                            break;
                        case 'right':
                            this.x = sceneWidth - scaledPanelWidth;
                            break;
                        default:
                            this.x = this.config.offsetX * scaleFactor;
                            break;
                    }
                    break;
                case 'right':
                    this.x = sceneWidth - scaledPanelWidth;
                    this.y = 0;
                    break;
                default:
                    this.x = 0;
                    this.y = 0;
                    break;
            }
        }

        const effectiveContentAreaHeight = availablePanelHeight || sceneHeight;

        const availableContentHeight = (effectiveContentAreaHeight / scaleFactor) - (this.config.titleHeight + this.config.padding * 2);

        if (this.content) {

            this.content.emit('panel-resized', {availableHeight: availableContentHeight});
        }
    }

    /**
     * Показывает панель с анимацией.
     */
    show() {
        this.setVisible(true);

        const sceneWidth = this.scene.scale.width;
        const scaleFactor = this.scaleX;

        const scaledPanelWidth = this.panelWidth * scaleFactor;
        const scaledPanelHeight = (this.panelHeight || this.scene.scale.height) * scaleFactor;
        const scaledHandleSize = this.config.handleSize * scaleFactor;

        let targetX, targetY;
        switch (this.config.position) {
            case 'top':
                targetY = this.config.handleSize > 0 ? -scaledPanelHeight + scaledHandleSize : 0;
                if (this.config.handleSize > 0) this.isExpanded = false;
                switch (this.config.alignX) {
                    case 'center':
                        targetX = (sceneWidth - scaledPanelWidth) / 2;
                        break;
                    case 'right':
                        targetX = sceneWidth - scaledPanelWidth;
                        break;
                    default:
                        targetX = this.config.offsetX * scaleFactor;
                        break;
                }
                this.setX(targetX);
                break;
            case 'right':
                targetX = sceneWidth - scaledPanelWidth;
                targetY = 0;
                this.setY(targetY);
                break;
            default:
                targetX = 0;
                targetY = 0;
                this.setY(targetY);
                break;
        }

        let targetProps = {};
        if (this.config.position === 'top' || this.config.position === 'bottom') {
            targetProps = {y: targetY};
        } else {
            targetProps = {x: targetX};
        }

        this.scene.tweens.add({
            targets: this,
            ...targetProps,
            duration: 400,
            ease: 'Cubic.Out',
            onComplete: () => {
                if (this && this.scene && this.active && this.content && typeof this.content.updateContent === 'function') {
                    this.content.updateContent();
                }
            }
        });
    }

    /**
     * Переключает состояние "свернуто/развернуто" для панелей с ручкой.
     */
    toggleExpand() {
        const scaledPanelHeight = (this.panelHeight || this.scene.scale.height) * this.scaleY;
        const scaledHandleSize = this.config.handleSize * this.scaleY;

        const targetY = this.isExpanded ? -scaledPanelHeight + scaledHandleSize : 0;
        this.isExpanded = !this.isExpanded;

        this.scene.tweens.add({
            targets: this,
            y: targetY,
            duration: 300,
            ease: 'Cubic.InOut'
        });
    }

    /**
     * Скрывает панель с анимацией и уничтожает ее.
     */
    hide() {
        const scaledPanelWidth = this.panelWidth * this.scaleX;
        const scaledPanelHeight = (this.panelHeight || this.scene.scale.height) * this.scaleY;

        let targetProps = {};
        switch (this.config.position) {
            case 'top':
                targetProps = {y: -scaledPanelHeight};
                break;
            case 'right':
                targetProps = {x: this.scene.scale.width};
                break;
            default:
                targetProps = {x: -scaledPanelWidth};
                break;
        }

        this.scene.tweens.add({
            targets: this,
            ...targetProps,
            duration: 300,
            ease: 'Cubic.In',
            onComplete: () => {
                this.emit('closed');
                this.destroy();
            }
        });
    }

    /**
     * Очищает ресурсы при уничтожении объекта.
     */
    destroy(fromScene) {
        if (this.scene && this.scene.events && this.resizeHandler) {
            this.scene.events.off('ui-resize', this.resizeHandler);
        }
        super.destroy(fromScene);
    }
}