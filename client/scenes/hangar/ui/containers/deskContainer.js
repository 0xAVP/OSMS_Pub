import {loadAvailableShipsForMint} from '../panels/mint/logic/loadShips.js';
import {createBuffsContainer} from './buffsContainer.js';
import {createShipSelectorElements, updateShipSelectorElements} from './shipSelectorContainer.js';
import {findInventoryItem} from '../actionUtils.js';

const UI_OFFSETS = {
    startGameButtonOffsetX: 1,
    startGameButtonOffsetY: 60,
    soundButtonOffsetX: 142,
    soundButtonOffsetY: 115,
    fullscreenButtonOffsetX: 340,
    fullscreenButtonOffsetY: 100,

    fuelIconOffsetX: 510,
    fuelIconOffsetY: 75,
    expIconOffsetX: 510,
    expIconOffsetY: 125,
    addShipButtonOffsetX: 1368,
    addShipButtonOffsetY: -21,
    selectMapButtonOffsetX: 1368,
    selectMapButtonOffsetY: -11,
    buffsContainerYOffset: -140,
    buffsContainerXOffset: -200
};

const TEXTURES = {
    desk: 'desk',
    startGame: 'start_game_btn',
    startGameActive: 'start_game_btn_active',
    sound: 'sw_sound_btn',
    fullscreen: 'sw_screen_btn',
    addShip: 'add_ship_btn',
    addShipActive: 'add_ship_btn_active',

    fuel: 'icon_fuel',
    exp: 'icon_exp',
    maps: [
        {normal: 'easy_mode_btn', active: 'easy_mode_btn_active'},
        {normal: 'medium_mode_btn', active: 'medium_mode_btn_active'},
        {normal: 'hard_mode_btn', active: 'hard_mode_btn_active'}
    ]
};

function getBestTextureKey(scene, baseKey, scaleFactor) {
    let suffix;
    if (scaleFactor <= 0.25) suffix = '@0.25x';
    else if (scaleFactor <= 0.5) suffix = '@0.5x';
    else if (scaleFactor <= 0.75) suffix = '@0.75x';
    else suffix = '@1x';
    const newKey = `${baseKey}${suffix}`;
    return scene.textures.exists(newKey) ? newKey : `${baseKey}@1x`;
}

function updateAssetTextureAndScale(gameObject, newTextureKey, base1xTextureKey) {
    if (!gameObject || !gameObject.scene) return;
    const scene = gameObject.scene;

    const baseTexture = scene.textures.get(base1xTextureKey);
    if (baseTexture.key === '__MISSING' || !baseTexture.source || !baseTexture.source[0]) {
        console.error(`Базовая текстура @1x не найдена: ${base1xTextureKey}`);
        return;
    }
    const baseWidth = baseTexture.source[0].width;
    const baseHeight = baseTexture.source[0].height;

    gameObject.setTexture(newTextureKey);
    const scaleX = baseWidth / gameObject.width;
    const scaleY = baseHeight / gameObject.height;
    gameObject.setScale(scaleX, scaleY);
    gameObject.setData('baseScaleX', scaleX);
    gameObject.setData('baseScaleY', scaleY);
}

function createButton(scene, {container, x, y, texture, activeTexture, onClick, simpleHover = false}) {
    const texture1x = texture + '@1x';
    const activeTexture1x = activeTexture ? activeTexture + '@1x' : null;

    const button = scene.add.image(x, y, texture1x).setInteractive({useHandCursor: true}).setDepth(1);
    button.setData('baseTextureKey', texture);
    button.setData('baseActiveTextureKey', activeTexture);

    if (activeTexture && scene.textures.exists(activeTexture1x)) {
        button.on('pointerover', () => button.setTexture(button.getData('activeTexture')));
        button.on('pointerout', () => button.setTexture(button.getData('normalTexture')));
    } else if (simpleHover) {
        button.on('pointerover', () => {
            const baseScaleX = button.getData('baseScaleX') || 1;
            const baseScaleY = button.getData('baseScaleY') || 1;
            button.setScale(baseScaleX * 1.05, baseScaleY * 1.05);
        });
        button.on('pointerout', () => {
            const baseScaleX = button.getData('baseScaleX') || 1;
            const baseScaleY = button.getData('baseScaleY') || 1;
            button.setScale(baseScaleX, baseScaleY);
        });
    }

    if (onClick) {
        button.on('pointerdown', () => onClick.call(scene, button));
    }
    container.add(button);
    return button;
}

async function handleStartGameClick() {
    const {isFullscreen} = this.scale;
    let startWidth, startHeight;
    if (isFullscreen) {
        startWidth = Math.floor(window.visualViewport?.width || screen.width / window.devicePixelRatio);
        startHeight = Math.floor(window.visualViewport?.height || screen.height / window.devicePixelRatio);
    } else {
        startWidth = Math.floor(window.innerWidth);
        startHeight = Math.floor(window.innerHeight);
    }
    console.log(this.currentMapIndex);
    this.startGame(this.currentMapIndex, startWidth, startHeight);
}

async function handleAddShipClick(button) {

    button.disableInteractive();
    button.setAlpha(0.9);
    this.sysMessageContainer.addMessage('Loading available ships...', 'DEFAULT');

    try {

        await loadAvailableShipsForMint.call(this);

        if (!this.scene || !this.scene.isActive()) return;

        if (this.availableShips && this.availableShips.length > 0) {
            this.modalManager.show('mintShip', {availableShips: this.availableShips});
        } else {
            this.sysMessageContainer.addMessage('Failed to load ships. Please try again.', 'ERROR');
        }
    } catch (error) {

        console.error('Failed to load available ships:', error);
        if (this.scene && this.scene.isActive()) {
            this.sysMessageContainer.addMessage('Error loading ships data.', 'ERROR');
        }
    } finally {

        if (button && button.scene) {
            button.setInteractive();
            button.setAlpha(1.0);
        }
    }
}

export function createDeskContainer() {
    this.deskContainer = this.add.container(this.scale.width / 2, this.scale.height).setDepth(500);
    this.uiElements.push(this.deskContainer);

    this.deskContainer.desk = this.add.image(0, 0, TEXTURES.desk + '@1x').setOrigin(0.5, 1).setDepth(0);
    this.deskContainer.add(this.deskContainer.desk);

    const deskCenterY = -this.deskContainer.desk.height / 2;
    const leftEdgeOfDesk = -this.deskContainer.desk.width / 2;
    const rightEdgeOfDesk = this.deskContainer.desk.width / 2;

    this.startGameButton = createButton(this, {
        container: this.deskContainer,
        x: UI_OFFSETS.startGameButtonOffsetX,
        y: deskCenterY + UI_OFFSETS.startGameButtonOffsetY,
        texture: TEXTURES.startGame,
        activeTexture: TEXTURES.startGameActive,
        onClick: handleStartGameClick
    });

    this.addShipButton = createButton(this, {
        container: this.deskContainer,
        x: leftEdgeOfDesk + UI_OFFSETS.addShipButtonOffsetX,
        y: deskCenterY + UI_OFFSETS.addShipButtonOffsetY,
        texture: TEXTURES.addShip,
        activeTexture: TEXTURES.addShipActive,
        onClick: handleAddShipClick
    });

    this.soundButton = createButton(this, {
        container: this.deskContainer,
        x: leftEdgeOfDesk + UI_OFFSETS.soundButtonOffsetX,
        y: deskCenterY + UI_OFFSETS.soundButtonOffsetY,
        texture: TEXTURES.sound,
        simpleHover: true,
        onClick: function () {
            this.game.sound.mute = !this.game.sound.mute;
        }
    });
    this.fullscreenButton = createButton(this, {
        container: this.deskContainer,
        x: leftEdgeOfDesk + UI_OFFSETS.fullscreenButtonOffsetX,
        y: deskCenterY + UI_OFFSETS.fullscreenButtonOffsetY,
        texture: TEXTURES.fullscreen,
        simpleHover: true,
        onClick: function () {
            this.scale.toggleFullscreen();
        }
    });

    const ICON_TEXT_STYLE = {fontFamily: 'Tektur', fontSize: '14px', color: '#ffffff'};

    const fuelIconX = leftEdgeOfDesk + UI_OFFSETS.fuelIconOffsetX;
    const fuelIconY = deskCenterY + UI_OFFSETS.fuelIconOffsetY;
    this.fuelIcon = this.add.image(fuelIconX, fuelIconY, `${TEXTURES.fuel}@1x`).setDepth(1);
    this.fuelIcon.setData('baseTextureKey', TEXTURES.fuel);

    const fuelTextX = fuelIconX + 35;
    this.fuelText = this.add.text(fuelTextX, fuelIconY, '0', ICON_TEXT_STYLE).setOrigin(0, 0.5).setDepth(1);

    const expIconX = leftEdgeOfDesk + UI_OFFSETS.expIconOffsetX;
    const expIconY = deskCenterY + UI_OFFSETS.expIconOffsetY;
    this.expIcon = this.add.image(expIconX, expIconY, `${TEXTURES.exp}@1x`).setDepth(1);
    this.expIcon.setData('baseTextureKey', TEXTURES.exp);

    const expTextX = expIconX + 35;
    this.expText = this.add.text(expTextX, expIconY, '0', ICON_TEXT_STYLE).setOrigin(0, 0.5).setDepth(1);

    this.deskContainer.add([this.fuelIcon, this.fuelText, this.expIcon, this.expText]);

    this.inventoryUpdateHandler = () => {

        if (this.fuelText && this.fuelText.scene && this.inventoryItems) {

            const fuelAmount = findInventoryItem(this, this.inventoryItems, 'fuel');

            this.fuelText.setText(fuelAmount.toString());
        }
    };

    this.events.on('inventory-updated', this.inventoryUpdateHandler);

    this.inventoryUpdateHandler();

    if (this.expText && typeof this.actualExp === 'number') {
        this.expText.setText(this.actualExp.toString());
    }

    this.expUpdateHandler = (newExp) => {
        if (this.expText && this.expText.scene && typeof newExp === 'number') {
            this.expText.setText(newExp.toString());
        }
    };
    this.events.on('exp-updated', this.expUpdateHandler);

    this.deskContainer.on('destroy', () => {
        if (this.expUpdateHandler) {
            this.events.off('exp-updated', this.expUpdateHandler);
        }

        if (this.inventoryUpdateHandler) {
            this.events.off('inventory-updated', this.inventoryUpdateHandler);
            console.log('inventory-updated listener removed from deskContainer.');
        }
    });

    const startGameButtonY = this.startGameButton.y;

    const buffsContainerX = UI_OFFSETS.startGameButtonOffsetX + UI_OFFSETS.buffsContainerXOffset;
    const buffsContainerY = startGameButtonY + UI_OFFSETS.buffsContainerYOffset;

    this.buffsContainer = createBuffsContainer(this, buffsContainerX, buffsContainerY);
    this.deskContainer.add(this.buffsContainer);

    this.mapOptions = this.mapOptions?.length === 3 ? this.mapOptions : [0, 1, 2];
    this.currentMapIndex = this.currentMapIndex ?? 0;
    const initialMapInfo = TEXTURES.maps[this.currentMapIndex];
    this.selectMapButton = createButton(this, {
        container: this.deskContainer,
        x: rightEdgeOfDesk - UI_OFFSETS.selectMapButtonOffsetX,
        y: deskCenterY + UI_OFFSETS.selectMapButtonOffsetY,
        texture: initialMapInfo.normal,
        activeTexture: initialMapInfo.active,
        onClick: function (button) {
            this.currentMapIndex = (this.currentMapIndex + 1) % this.mapOptions.length;
            console.log(`Map index changed to: ${this.currentMapIndex} (Type: ${typeof this.currentMapIndex})`);
            const newMapInfo = TEXTURES.maps[this.currentMapIndex];
            button.setData('baseTextureKey', newMapInfo.normal);
            button.setData('baseActiveTextureKey', newMapInfo.active);
            updateDeskContainer.call(this, this.scale.width, this.scale.height);
            button.setTexture(button.getData('activeTexture'));
        }
    });

    createShipSelectorElements.call(this);

    updateDeskContainer.call(this, this.scale.width, this.scale.height);
}

export function updateDeskContainer(adjustedWidth, adjustedHeight) {
    if (!this.deskContainer?.desk) return;

    const baseDeskTexture = this.textures.get(TEXTURES.desk + '@1x');
    if (baseDeskTexture.key === '__MISSING' || !baseDeskTexture.source || !baseDeskTexture.source[0]) {
        console.error("Базовая текстура стола (@1x) не найдена.");
        return;
    }
    const baseDeskWidth = baseDeskTexture.source[0].width;
    const scaleFactor = adjustedWidth / baseDeskWidth;

    this.deskContainer.setScale(scaleFactor);
    this.deskContainer.setPosition(adjustedWidth / 2, adjustedHeight);

    if (this.buffsContainer && this.startGameButton) {

        const startGameButtonY = this.startGameButton.y;
        const buffsContainerX = UI_OFFSETS.startGameButtonOffsetX + UI_OFFSETS.buffsContainerXOffset;
        const buffsContainerY = startGameButtonY + UI_OFFSETS.buffsContainerYOffset;
        this.buffsContainer.setPosition(buffsContainerX, buffsContainerY);
    }

    const allImages = [
        this.startGameButton, this.soundButton, this.fullscreenButton,
        this.addShipButton, this.selectMapButton,
        this.fuelIcon, this.expIcon
    ];

    const deskKey = getBestTextureKey(this, TEXTURES.desk, scaleFactor);
    updateAssetTextureAndScale(this.deskContainer.desk, deskKey, TEXTURES.desk + '@1x');

    allImages.forEach(imageObject => {
        if (!imageObject) return;
        const baseKey = imageObject.getData('baseTextureKey');
        if (!baseKey) return;

        const activeBaseKey = imageObject.getData('baseActiveTextureKey');
        const newNormalKey = getBestTextureKey(this, baseKey, scaleFactor);
        imageObject.setData('normalTexture', newNormalKey);

        if (activeBaseKey) {
            imageObject.setData('activeTexture', getBestTextureKey(this, activeBaseKey, scaleFactor));
        }

        updateAssetTextureAndScale(imageObject, newNormalKey, baseKey + '@1x');
    });

    const BASE_WIDTH = 1920;

    const ICON_BASE_FONT = 14;
    const ICON_MIN_FONT = 12;
    const ICON_MAX_FONT = 28;
    let preferredIconSize = (adjustedWidth / BASE_WIDTH) * ICON_BASE_FONT;
    let finalIconSize = Math.max(ICON_MIN_FONT, Math.min(preferredIconSize, ICON_MAX_FONT));

    const SHIP_BASE_FONT = 20;
    const SHIP_MIN_FONT = 12;
    const SHIP_MAX_FONT = 40;
    let preferredShipNameSize = (adjustedWidth / BASE_WIDTH) * SHIP_BASE_FONT;
    let finalShipNameSize = Math.max(SHIP_MIN_FONT, Math.min(preferredShipNameSize, SHIP_MAX_FONT));

    if (this.fuelText) this.fuelText.setFontSize(finalIconSize);
    if (this.expText) this.expText.setFontSize(finalIconSize);
    if (this.shipNameText) this.shipNameText.setFontSize(finalShipNameSize);

    if (scaleFactor > 0) {
        const inverseScale = 1 / scaleFactor;
        const textObjects = [this.fuelText, this.expText, this.shipNameText];
        textObjects.forEach(text => {
            if (text) {
                text.setScale(inverseScale);
            }
        });
    }

    updateShipSelectorElements.call(this);
}