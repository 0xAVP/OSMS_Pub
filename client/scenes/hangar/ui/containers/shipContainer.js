import {selectTextureAndScale} from '../../../core/utils.js';
import {ShipModuleDisplay} from '../components/ShipModuleDisplay.js';

const BASE_SCREEN_WIDTH = 1920;
const BASE_ELLIPSE_WIDTH = 950;
const BASE_ELLIPSE_HEIGHT = 650;
const BASE_MODULE_SIZE = 100;
const BASE_EXTRA_MODULE_SIZE = 80;

export function createShipContainer() {
    console.log('%cCreating refactored shipContainer...', 'color: green; font-weight: bold;');
    this.shipContainer = this.add.container(0, 0).setDepth(5);
    this.uiElements.push(this.shipContainer);
    this.shipSprite = this.add.sprite(0, 0, 'Nebular@1x').setDepth(1).setVisible(false);
    this.shipModuleDisplay = new ShipModuleDisplay(this, this.shipSprite);
    this.shipContainer.add([this.shipSprite, this.shipModuleDisplay]);

    this.shipModuleDisplay.on('module-slot-clicked', (slotKey) => {

        this.sidePanelManager.open('ship');

        const shipPanelInstance = this.sidePanelManager.activePanels.get('ship');

        if (shipPanelInstance && shipPanelInstance.content && typeof shipPanelInstance.content._handleModuleClick === 'function') {

            this.time.delayedCall(50, () => {

                if (shipPanelInstance.content) {
                    shipPanelInstance.content._handleModuleClick(slotKey);
                }
            });
        }
    });

    this.tweens.add({
        targets: this.shipSprite,
        y: this.shipSprite.y + 20,
        duration: 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
    });

    const handleModuleUpdate = () => {

        if (this && this.scene && this.updateShipContainer) {
            console.log('Module update event received, refreshing shipContainer.');

            this.updateShipContainer.call(this, this.adjustedWidth, this.adjustedHeight);
        }
    };

    this.events.on('moduleInShipUpgraded', handleModuleUpdate, this);
    this.events.on('moduleInShipInstalled', handleModuleUpdate, this);

    this.events.once('destroy', () => {
        this.events.off('moduleInShipUpgraded', handleModuleUpdate, this);
        this.events.off('moduleInShipInstalled', handleModuleUpdate, this);
    });

}

export function updateShipContainer(adjustedWidth, adjustedHeight) {
    if (!this.shipContainer) {
        console.warn('shipContainer is not available, skipping update.');
        return;
    }

    let newShipContainerY;

    if (this.navContainer && this.deskContainer && this.deskContainer.desk) {
        const navBounds = this.navContainer.getBounds();
        const deskBounds = this.deskContainer.desk.getBounds();
        const topBoundary = navBounds.bottom;
        const bottomBoundary = deskBounds.top;
        const availableSpace = bottomBoundary - topBoundary;
        newShipContainerY = topBoundary + (availableSpace / 2);
    } else {
        newShipContainerY = adjustedHeight / 2 - 40;
    }

    this.shipContainer.setPosition(adjustedWidth / 2, newShipContainerY);

    const shipVisualAreaWidth = adjustedWidth * 0.40;
    const paddingPercent = 0.15;
    const maxShipWidth = shipVisualAreaWidth * (1 - 2 * paddingPercent);

    if (this.shipSprite && this.selectedShip && this.selectedShip.type) {
        const currentShipType = this.shipSprite.getData('shipType');
        const currentMaxWidth = this.shipSprite.getData('maxShipWidth') || 0;
        if (this.selectedShip.type !== currentShipType || Math.abs(maxShipWidth - currentMaxWidth) > 1) {
            const {textureKey, scale} = selectTextureAndScale(this, this.selectedShip.type, maxShipWidth);
            this.shipSprite.setTexture(textureKey);
            this.shipSprite.setScale(scale);
            this.shipSprite.setData('shipType', this.selectedShip.type);
            this.shipSprite.setData('maxShipWidth', maxShipWidth);
        }
        this.shipSprite.setVisible(true);

        const scaleFactor = adjustedWidth / BASE_SCREEN_WIDTH;
        const currentEllipseWidth = BASE_ELLIPSE_WIDTH * scaleFactor;
        const currentEllipseHeight = BASE_ELLIPSE_HEIGHT * scaleFactor;
        const currentModuleSize = BASE_MODULE_SIZE * scaleFactor;
        const currentExtraModuleSize = BASE_EXTRA_MODULE_SIZE * scaleFactor;

        this.shipModuleDisplay.update(this.selectedShip, {
            ellipseWidth: currentEllipseWidth,
            ellipseHeight: currentEllipseHeight,
            moduleSize: currentModuleSize,
            extraModuleSize: currentExtraModuleSize,
            scaleFactor: scaleFactor
        });

    } else if (this.shipSprite) {
        this.shipSprite.setVisible(false);
        this.shipModuleDisplay.setVisible(false);
    }
}