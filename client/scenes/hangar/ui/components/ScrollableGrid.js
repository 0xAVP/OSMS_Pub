import {Scrollbar} from './Scrollbar.js';
import Phaser from 'phaser';

const DEFAULTS = {
    x: 0,
    y: 0,
    width: 300,
    height: 400,
    columns: 3,
    cellWidth: 80,
    cellHeight: 80,
    gap: 15,
    scrollbarWidth: 10,
    thumbWidth: 30,
    scrollbarPosition: 'right',
    bottomPadding: 100
};

const GAP = 20;

export class ScrollableGrid extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, finalConfig.x, finalConfig.y);

        this.config = finalConfig;
        this.items = [];
        this.itemObjects = [];
        this.maxScroll = 0;
        this.maskGraphics = null;

        this.viewportWidth = this.config.width - this.config.scrollbarWidth - GAP;

        this._createUI();
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateMask, this);
        scene.add.existing(this);
    }

    _createUI() {
        const {height, scrollbarWidth, scrollbarPosition, thumbWidth, bottomPadding} = this.config;
        this.viewport = this.scene.add.container(0, 0);
        this.contentContainer = this.scene.add.container(0, 0);
        this.viewport.add(this.contentContainer);

        const scrollbarX = (scrollbarPosition === 'left') ? 0 : this.viewportWidth + GAP;
        if (scrollbarPosition === 'left') {
            this.viewport.x = scrollbarWidth + GAP;
        }

        this.add(this.viewport);
        this.maskGraphics = this.scene.add.graphics().setVisible(false);
        const mask = this.maskGraphics.createGeometryMask();
        this.viewport.setMask(mask);

        this.scrollbar = new Scrollbar(this.scene, {
            x: scrollbarX,
            y: 0,
            height: height - bottomPadding,
            width: scrollbarWidth,
            thumbWidth: thumbWidth
        });
        this.add(this.scrollbar);
        this._setupInputHandlers();
    }

    updateMask() {
        if (!this.maskGraphics || !this.scene || !this.active || !this.visible) return;
        const {height} = this.config;
        const worldMatrix = this.viewport.getWorldTransformMatrix();

        this.maskGraphics.clear();
        this.maskGraphics.fillStyle(0xffffff);
        this.maskGraphics.fillRect(worldMatrix.tx, worldMatrix.ty, this.viewportWidth * worldMatrix.scaleX, height * worldMatrix.scaleY);
    }

    _updateItemInteractivity() {
        if (!this.contentContainer || !this.itemObjects) return;

        const viewTop = -this.contentContainer.y;

        const viewBottom = viewTop + this.config.height;

        this.itemObjects.forEach(item => {

            const itemTop = item.y - (item.displayHeight / 2);
            const itemBottom = item.y + (item.displayHeight / 2);

            if (itemBottom > viewTop && itemTop < viewBottom) {

                item.setInteractive();
            } else {

                item.disableInteractive();
            }
        });
    }

    _setupInputHandlers() {
        this.scrollbar.on('scroll', (progress) => {
            this.contentContainer.y = -progress * this.maxScroll;
            this._updateItemInteractivity();
        });

        this.wheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
            if (!this.visible || this.maxScroll <= 0 || !this.getBounds().contains(pointer.worldX, pointer.worldY)) {
                return;
            }

            const scrollStep = 10;
            let newY = this.contentContainer.y - (deltaY > 0 ? scrollStep : -scrollStep);
            this.contentContainer.y = Phaser.Math.Clamp(newY, -this.maxScroll, 0);

            const progress = this.maxScroll > 0 ? -this.contentContainer.y / this.maxScroll : 0;
            this.scrollbar.updateThumb(progress);
            this._updateItemInteractivity();
        };

        this.scene.input.on('wheel', this.wheelHandler);
    }

    populate(items, itemFactory) {
        this.items = items;
        const currentScrollY = this.contentContainer.y;
        this.contentContainer.removeAll(true);
        this.itemObjects = [];
        const {columns, cellWidth, cellHeight, gap} = this.config;
        items.forEach((itemData, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            const x = col * (cellWidth + gap) + cellWidth / 2;
            const y = row * (cellHeight + gap) + cellHeight / 2;
            const itemObject = itemFactory(itemData);
            itemObject.setPosition(x, y);
            this.contentContainer.add(itemObject);
            this.itemObjects.push(itemObject);
        });

        this._updateScrollbar();
        this.contentContainer.y = Phaser.Math.Clamp(currentScrollY, -this.maxScroll, 0);
        const progress = this.maxScroll > 0 ? -this.contentContainer.y / this.maxScroll : 0;
        this.scrollbar.updateThumb(progress);
        this._updateItemInteractivity();
    }

    _updateScrollbar() {
        const {columns, cellHeight, gap, height} = this.config;
        const totalRows = Math.ceil(this.items.length / columns);
        const contentHeight = totalRows * cellHeight + Math.max(0, totalRows - 1) * gap;

        const viewportHeight = height;
        this.maxScroll = Math.max(0, contentHeight - (viewportHeight - DEFAULTS.bottomPadding));

        const isScrollable = this.maxScroll > 0;
        this.scrollbar.setVisibleState(isScrollable);

        if (!isScrollable) {
            this.contentContainer.y = 0;
        }
    }

    resize(newHeight) {
        if (!this.scene || !this.active || this.config.height === newHeight) {
            return;
        }
        this.config.height = newHeight;
        this.scrollbar.resize(newHeight - this.config.bottomPadding);
        this._updateScrollbar();
        this.contentContainer.y = Phaser.Math.Clamp(this.contentContainer.y, -this.maxScroll, 0);
        const progress = this.maxScroll > 0 ? -this.contentContainer.y / this.maxScroll : 0;
        this.scrollbar.updateThumb(progress);
        this._updateItemInteractivity();
    }

    destroy(fromScene) {
        if (this.scene) {
            this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateMask, this);
            if (this.wheelHandler) {
                this.scene.input.off('wheel', this.wheelHandler);
            }
        }
        if (this.maskGraphics) {
            this.maskGraphics.destroy();
        }
        super.destroy(fromScene);
    }
}
