import {updateUI} from './updateUI.js';
import {
    createNavContainer,
    createShipContainer,
    createDeskContainer,
    updateNavContainer,
    updateDeskContainer,
    updateShipContainer,
    createSysMessageContainer,
    updateSysMessageContainer
} from './ui/containers/containers.js';
import {loadAvailableShipsForMint} from './ui/panels/mint/logic/loadShips.js';

import {Tooltip} from './ui/components/tooltip/';
import {startBuffExpirationChecker, stopBuffExpirationChecker} from '../shared/BuffService.js';
import {soundManager} from "../shared/SoundManager";

function createDynamicTextures(scene) {

    if (!scene.textures.exists('projection_disc_glow')) {
        const size = 128;
        const radius = size / 2;
        const rt = scene.make.renderTexture({width: size, height: size}, false);
        const graphics = scene.make.graphics({add: false});

        for (let i = radius; i > 0; i--) {
            const alpha = 1 - (i / radius);
            graphics.clear();
            graphics.fillStyle(0xffffff, alpha * 0.1);
            graphics.fillCircle(radius, radius, i);
            rt.draw(graphics, 0, 0);
        }

        rt.saveTexture('projection_disc_glow');
        graphics.destroy();
        rt.destroy();
        console.log('Dynamic texture "projection_disc_glow" created.');
    }
}

export function createScene() {
    console.log('%cHANGAR SCENE: createScene() called', 'color: purple; font-weight: bold;');
    this.isSceneReady = false;
    createDynamicTextures(this);

    const background = this.add.image(0, 0, 'hangar-bg').setOrigin(0, 0).setDepth(-1);
    this.uiElements = [background];

    if (!this.pilots || this.pilots.length === 0) {
        console.log('No echoes found, displaying mint button...');

        createMintPilotButton.call(this);
        return;
    }

    this.tooltip = new Tooltip(this);

    createNavContainer.call(this);
    createShipContainer.call(this);
    createDeskContainer.call(this);
    createSysMessageContainer.call(this);

    this.updateNavContainer = updateNavContainer;
    this.updateDeskContainer = updateDeskContainer;
    this.updateShipContainer = updateShipContainer;
    this.updateShipContainer = updateShipContainer;
    this.updateSysMessageContainer = updateSysMessageContainer;

    this.events.on('ui-resize', (data) => {
        updateUI.call(this, data.width, data.height);
    });

    updateUI.call(this, this.scale.width, this.scale.height);

    if ((!this.ships || this.ships.length === 0)) {

        (async () => {
            console.log('No ships found, starting non-blocking check to open mint window...');

            try {

                await loadAvailableShipsForMint.call(this);

                if (!this.scene || !this.scene.isActive()) return;

                if (this.availableShips && this.availableShips.length > 0) {
                    this.modalManager.show('mintShip', {availableShips: this.availableShips});
                } else {
                    this.sysMessageContainer.addMessage('No ships available for minting at this moment.', 'WARNING');
                }
            } catch (error) {
                console.error('Failed to auto-load available ships for minting:', error);
                if (this.sysMessageContainer && this.scene && this.scene.isActive()) {
                    this.sysMessageContainer.addMessage('Error loading ship data for minting.', 'ERROR');
                }
            }
        })();
    }

    this.game.canvas.focus();

    this.adjustedWidth = this.scale.width;
    this.adjustedHeight = this.scale.height;

    this.resizeHandler = (gameSize) => {

        if (!this.scene || !this.scene.isActive()) {
            return;
        }

        this.time.delayedCall(1, () => {

            if (!this.scene || !this.scene.isActive()) {
                return;
            }

            this.adjustedWidth = Math.floor(this.scale.width);
            this.adjustedHeight = Math.floor(this.scale.height);

            let availablePanelHeight = this.adjustedHeight;

            if (this.deskContainer && this.textures.exists('desk@1x')) {

                const baseDeskTexture = this.textures.get('desk@1x');
                const baseDeskWidth = baseDeskTexture.source[0].width;
                const baseDeskHeight = baseDeskTexture.source[0].height;

                const scaleFactor = this.adjustedWidth / baseDeskWidth;

                const currentDeskHeight = baseDeskHeight * scaleFactor;

                availablePanelHeight = this.adjustedHeight - currentDeskHeight + 100;

            }

            this.events.emit('ui-resize', {
                width: this.adjustedWidth,
                height: this.adjustedHeight,
                availablePanelHeight: availablePanelHeight
            });
        });
    };

    this.scale.on('resize', this.resizeHandler);

    this.scale.off('fullscreenchange');
    this.scale.on('fullscreenchange', () => this.resizeHandler(this.scale));

    this.isSceneReady = true;
    console.log('HangarScene is now ready.');

    startBuffExpirationChecker(this);

    soundManager.playMusic('hangar_music');

    this.events.on('destroy', () => {
        stopBuffExpirationChecker();
    });

}

function createMintPilotButton() {

    const button = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Mint Your First Echo', {
        fontFamily: 'Tektur',
        fontSize: '28px',
        fontWeight: '600',
        color: '#ffffff',
        padding: {x: 40, y: 20},
        align: 'center'
    }).setOrigin(0.5).setInteractive();

    const graphics = this.add.graphics();
    const width = button.width + 20;
    const height = button.height + 20;
    const x = button.x - width / 2;
    const y = button.y - height / 2;

    graphics.fillGradientStyle(0x2a1b3d, 0x2a1b3d, 0x1b263b, 0x1b263b, 1);
    graphics.fillRoundedRect(x, y, width, height, 10);
    graphics.lineStyle(1, 0x40c4ff, 0.5);
    graphics.strokeRoundedRect(x, y, width, height, 10);
    graphics.setDepth(button.depth - 1);

    button.setShadow(0, 0, '#40c4ff', 6, true, true);

    const infoText = this.add.text(this.scale.width / 2, this.scale.height / 2 + height / 2 + 30, 'At least one Echo is required to play the game', {
        fontFamily: 'Tektur',
        fontSize: '18px',
        fontWeight: 'normal',
        color: '#b0bec5',
        align: 'center'
    }).setOrigin(0.5);

    infoText.setShadow(0, 0, '#40c4ff', 3, true, true);

    this.tweens.add({
        targets: [button, infoText],
        alpha: {from: 0.95, to: 1},
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    button.on('pointerdown', () => {
        if (this.navigate) {
            console.log('Navigating to /mint-echo');
            this.navigate('/mint-echo');

            this.tweens.add({
                targets: button,
                scale: {from: 1.05, to: 0.95},
                duration: 100,
                yoyo: true
            });
        } else {
            console.error('Navigate function is not available!');
        }
    });

    button.on('pointerover', () => {
        button.setScale(1.05);
        button.setShadow(0, 0, '#ab47bc', 8, true, true);
        graphics.clear();
        graphics.fillGradientStyle(0x2a1b3d, 0x2a1b3d, 0x1b263b, 0x1b263b, 1);
        graphics.fillRoundedRect(x, y, width, height, 10);
        graphics.lineStyle(1, 0xab47bc, 0.7);
        graphics.strokeRoundedRect(x, y, width, height, 10);
    });

    button.on('pointerout', () => {
        button.setScale(1);
        button.setShadow(0, 0, '#40c4ff', 6, true, true);
        graphics.clear();
        graphics.fillGradientStyle(0x2a1b3d, 0x2a1b3d, 0x1b263b, 0x1b263b, 1);
        graphics.fillRoundedRect(x, y, width, height, 10);
        graphics.lineStyle(1, 0x40c4ff, 0.5);
        graphics.strokeRoundedRect(x, y, width, height, 10);
    });

    this.mintButtonResizeHandler = (gameSize) => {

        if (!button || !button.scene) {
            if (this.scale && this.mintButtonResizeHandler) {
                this.scale.off('resize', this.mintButtonResizeHandler);
                this.mintButtonResizeHandler = null;
            }
            return;
        }

        const newX = gameSize.width / 2;
        const newY = gameSize.height / 2;
        button.setPosition(newX, newY);
        infoText.setPosition(newX, newY + height / 2 + 30);

        graphics.clear();
        graphics.fillGradientStyle(0x2a1b3d, 0x2a1b3d, 0x1b263b, 0x1b263b, 1);
        graphics.fillRoundedRect(newX - width / 2, newY - height / 2, width, height, 10);
        graphics.lineStyle(1, 0x40c4ff, 0.5);
        graphics.strokeRoundedRect(newX - width / 2, newY - height / 2, width, height, 10);
    };

    this.scale.on('resize', this.mintButtonResizeHandler);

    button.on('destroy', () => {
        console.log('Mint Echo button destroyed, cleaning up its resources.');
        graphics.destroy();
        infoText.destroy();

        if (this.scale && this.mintButtonResizeHandler) {
            this.scale.off('resize', this.mintButtonResizeHandler);
            this.mintButtonResizeHandler = null;
        }
    });

    return button;
}