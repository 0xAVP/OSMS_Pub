import Phaser from 'phaser';
import {ethers} from 'ethers';
import {ActionButton} from '../../components/ActionButton.js';
import {findInventoryItem} from '../../actionUtils.js';
import {CONFIG} from '../../../../core/config.js';
import {selectTextureAndScale} from '../../../../core/utils.js';

const STYLES = {

    header: {fontFamily: 'Tektur', fontSize: '14px', color: '#41C6FF', fontStyle: 'bold'},

    walletLabel: {fontFamily: 'Tektur', fontSize: '12px', color: '#888888'},
    walletAddress: {fontFamily: 'Tektur', fontSize: '18px', color: '#ffffff'},

    tokenValue: {fontFamily: 'Tektur', fontSize: '36px', color: '#FEBA00', fontStyle: 'bold'},
    tokenLabel: {fontFamily: 'Tektur', fontSize: '16px', color: '#FEBA00'},

    cardValue: {fontFamily: 'Tektur', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'},
    cardLabel: {fontFamily: 'Tektur', fontSize: '18px', color: '#a0a0a0'},

    tagOn: {
        fontFamily: 'Tektur',
        fontSize: '10px',
        color: '#42DA9D',
        backgroundColor: '#1a332a',
        fixedWidth: 60,
        align: 'center'
    },
    tagOff: {
        fontFamily: 'Tektur',
        fontSize: '10px',
        color: '#888888',
        backgroundColor: '#222222',
        fixedWidth: 65,
        align: 'center'
    }
};

const LAYOUT = {
    CARD_HEIGHT: 70,
    HERO_HEIGHT: 100,
    GAP: 15,
    ICON_SIZE: 40
};

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
];

/**
 * Утилита: Устанавливает текст и масштабирует его, если он не влезает в maxWidth.
 */
function updateTextToFit(textObj, value, maxWidth) {
    const formattedText = value.toLocaleString();
    textObj.setText(formattedText);
    textObj.setScale(1);

    if (textObj.width > maxWidth) {
        const scale = maxWidth / textObj.width;
        textObj.setScale(scale);
    }
}

/**
 * Карточка кошелька (самая верхняя)
 */
function createWalletCard(scene, width) {
    const height = 70;
    const container = scene.add.container(0, 0);

    const bg = scene.add.graphics();
    bg.fillStyle(0x0f0a14, 0.9)
        .fillRoundedRect(0, 0, width, height, 12)
        .lineStyle(1, 0x41C6FF, 0.3)
        .strokeRoundedRect(0, 0, width, height, 12);

    const stripe = scene.add.graphics();
    stripe.fillStyle(0x41C6FF, 1).fillRoundedRect(0, 15, 6, height - 30, 2);

    const label = scene.add.text(20, 12, 'COMMANDER ID (WALLET)', STYLES.walletLabel);

    const rawAddress = scene.walletAddress || '0x0000000000000000000000000000000000000000';
    const shortAddress = `${rawAddress.slice(0, 10)}...${rawAddress.slice(-8)}`;
    const addressText = scene.add.text(20, 32, shortAddress, STYLES.walletAddress);

    const buttonX = addressText.x + addressText.width + 30;
    const copyButton = new ActionButton(scene, {
        x: width - 80,
        y: height / 2,
        texture: 'copy',
        scale: 0.7
    });

    copyButton.on('click', () => {
        if (scene.walletAddress) {
            navigator.clipboard.writeText(scene.walletAddress)
                .then(() => scene.sysMessageContainer.addMessage('Address copied!', 'SUCCESS'))
                .catch(() => scene.sysMessageContainer.addMessage('Copy failed.', 'ERROR'));
        }
    });

    container.add([bg, stripe, label, addressText, copyButton]);
    return container;
}

/**
 * Карточка OSMS Токена (Hero Card) - выделяется цветом
 */
function createTokenCard(scene, width, value) {
    const height = LAYOUT.HERO_HEIGHT;
    const container = scene.add.container(0, 0);

    const bg = scene.add.graphics();
    bg.fillStyle(0x2a2210, 0.8)
        .fillRoundedRect(0, 0, width, height, 12)
        .lineStyle(1, 0xFEBA00, 0.4)
        .strokeRoundedRect(0, 0, width, height, 12);

    const {textureKey: bgIconKey} = selectTextureAndScale(scene, 'osms_token', 1);
    if (bgIconKey !== '__MISSING') {
        const bgIcon = scene.add.image(width - 60, height / 2, bgIconKey).setScale(2.5).setAlpha(0.1).setTint(0xFEBA00);
        container.add(bgIcon);
    }

    const {textureKey, scale} = selectTextureAndScale(scene, 'osms_token', 60);
    const icon = scene.add.image(50, height / 2, textureKey).setScale(scale);

    const valueText = scene.add.text(100, height / 2 - 5, value, STYLES.tokenValue).setOrigin(0, 0.5);
    const labelText = scene.add.text(100, height / 2 + 25, 'OSMS TOKENS', STYLES.tokenLabel).setOrigin(0, 0.5);

    const tag = scene.add.text(width - 70, 15, 'ON-CHAIN', STYLES.tagOn).setOrigin(0.5);

    container.add([bg, icon, valueText, labelText, tag]);

    container.updateValue = (val) => {

        updateTextToFit(valueText, val, width - 180);
    };

    return container;
}

/**
 * Карточка актива (Строка)
 */
function createAssetCard(scene, width, iconKey, value, label, chainTag) {
    const height = LAYOUT.CARD_HEIGHT;
    const container = scene.add.container(0, 0);

    const bg = scene.add.graphics();
    bg.fillStyle(0x1A1325, 0.9)
        .fillRoundedRect(0, 0, width, height, 10)
        .lineStyle(1, 0x444444, 0.5)
        .strokeRoundedRect(0, 0, width, height, 10);

    const {textureKey, scale} = selectTextureAndScale(scene, iconKey, 45);
    const icon = scene.add.image(40, height / 2, textureKey).setScale(scale);

    const labelText = scene.add.text(80, height / 2, label.toUpperCase(), STYLES.cardLabel).setOrigin(0, 0.5);

    const tagStyle = chainTag === 'ON-CHAIN' ? STYLES.tagOn : STYLES.tagOff;
    const tag = scene.add.text(width - 40, 12, chainTag, tagStyle).setOrigin(0.5);

    const valueText = scene.add.text(width - 20, height / 2 + 8, value.toString(), STYLES.cardValue).setOrigin(1, 0.5);

    container.add([bg, icon, labelText, tag, valueText]);

    container.updateValue = (val) => {

        const availableWidth = width - labelText.width - 120;
        updateTextToFit(valueText, val, availableWidth);
    };

    container.updateValue(value);

    return container;
}

export function createAccountTab(scene, totalWidth, totalHeight) {
    const container = scene.add.container(0, 0);

    const contentWidth = Math.min(totalWidth - 40, 600);
    const startX = (totalWidth - contentWidth) / 2;
    let currentY = 20;

    const walletCard = createWalletCard(scene, contentWidth);
    walletCard.setPosition(startX, currentY);
    container.add(walletCard);

    currentY += 70 + LAYOUT.GAP + 10;

    const tokenCard = createTokenCard(scene, contentWidth, 'Loading...');
    tokenCard.setPosition(startX, currentY);
    container.add(tokenCard);
    currentY += LAYOUT.HERO_HEIGHT + LAYOUT.GAP;

    const totalPilots = (scene.pilots || []).reduce((t, p) => t + (p.amount || 0), 0);
    const pilotsCard = createAssetCard(scene, contentWidth, 'ic_pilot', totalPilots, 'Echoes', 'ON-CHAIN');
    pilotsCard.setPosition(startX, currentY);
    container.add(pilotsCard);
    currentY += LAYOUT.CARD_HEIGHT + LAYOUT.GAP;

    const shipsCard = createAssetCard(scene, contentWidth, 'ic_ship', scene.ships?.length || 0, 'Ships', 'ON-CHAIN');
    shipsCard.setPosition(startX, currentY);
    container.add(shipsCard);
    currentY += LAYOUT.CARD_HEIGHT + LAYOUT.GAP;

    const fuelAmount = findInventoryItem(scene, scene.inventoryItems, 'fuel');
    const fuelCard = createAssetCard(scene, contentWidth, 'icon_fuel', fuelAmount, 'Fuel', 'OFF-CHAIN');
    fuelCard.setPosition(startX, currentY);
    container.add(fuelCard);
    currentY += LAYOUT.CARD_HEIGHT + LAYOUT.GAP;

    const expCard = createAssetCard(scene, contentWidth, 'icon_exp', scene.actualExp || 0, 'Experience', 'OFF-CHAIN');
    expCard.setPosition(startX, currentY);
    container.add(expCard);

    const fetchTokenBalance = async () => {
        try {
            if (!scene.walletAddress || !scene.provider) return;
            const tokenAddress = CONFIG.blockchain?.OSMS_TOKEN_ADDRESS || import.meta.env.VITE_OSMS_TOKEN_ADDRESS;

            if (!tokenAddress) {
                tokenCard.updateValue('Error');
                return;
            }

            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, scene.provider);
            const balanceWei = await tokenContract.balanceOf(scene.walletAddress);
            const balanceEth = ethers.formatEther(balanceWei);
            const formatted = parseFloat(balanceEth).toLocaleString(undefined, {maximumFractionDigits: 2});

            if (tokenCard.active) {
                tokenCard.updateValue(formatted);
            }
        } catch (error) {
            console.error('Error fetching OSMS balance:', error);
            if (tokenCard.active) tokenCard.updateValue('Err');
        }
    };

    fetchTokenBalance();

    container.update = () => {
        if (fuelCard.active) {
            const currentFuel = findInventoryItem(scene, scene.inventoryItems, 'fuel');
            fuelCard.updateValue(currentFuel);
        }
        if (expCard.active) {
            expCard.updateValue(scene.actualExp || 0);
        }
        if (shipsCard.active) {
            shipsCard.updateValue(scene.ships?.length || 0);
        }
        if (pilotsCard.active) {
            const currentPilots = (scene.pilots || []).reduce((t, p) => t + (p.amount || 0), 0);
            pilotsCard.updateValue(currentPilots);
        }
        fetchTokenBalance();
    };

    const updateHandler = () => container.update();

    scene.events.on('inventory-updated', updateHandler);
    scene.events.on('exp-updated', updateHandler);
    scene.events.on('factories-updated', updateHandler);

    container.on('destroy', () => {
        scene.events.off('inventory-updated', updateHandler);
        scene.events.off('exp-updated', updateHandler);
        scene.events.off('factories-updated', updateHandler);
    });

    return container;
}
