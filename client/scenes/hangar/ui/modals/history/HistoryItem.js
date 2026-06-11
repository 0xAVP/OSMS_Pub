import Phaser from 'phaser';
import {Utils, selectTextureAndScale} from '../../../../core/utils.js';

const STYLES = {
    type: {fontFamily: 'Tektur', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'},
    hash: {fontFamily: 'Tektur', fontSize: '12px', color: '#888888'},
    amount: {fontFamily: 'Tektur', fontSize: '16px', color: '#FEBA00', align: 'right', fontStyle: 'bold'},
    status: {fontFamily: 'Tektur', fontSize: '12px', align: 'right'}
};

const STATUS_COLORS = {
    'RESERVED': '#FEBA00',
    'FINALIZED': '#42DA9D',
    'FAILED': '#FF4D4D',
    'REFUNDED': '#41C6FF'
};

export class HistoryItem extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, txData) {
        super(scene, x, y);
        this.width = width;
        this.height = height;
        this.tx = txData;

        this._createUI();
    }

    _createUI() {
        const w = this.width;
        const h = this.height;
        const centerY = h / 2;

        const hasHash = !!this.tx.transactionHash;

        const initialBgColor = hasHash ? 0x1A1325 : 0x2c2f38;
        const bg = this.scene.add.graphics();
        bg.fillStyle(initialBgColor, 0.8).fillRoundedRect(0, 0, w, h, 8);
        this.add(bg);

        let iconKey = 'osms_token';
        let typeStr = 'TRANSACTION';
        let amountStr = '';

        if (this.tx.type === 'SHIP_CRAFT') {
            typeStr = this.tx.shipName ? this.tx.shipName.toUpperCase() : 'CRAFT SHIP';
            iconKey = this.tx.shipName || 'default_ship';
            amountStr = 'NFT';
        } else if (this.tx.type === 'TOKEN_CLAIM') {

            typeStr = 'WITHDRAW';
            iconKey = 'osms_token';

            if (this.tx.coinsAmount) {
                const coins = Number(this.tx.coinsAmount);
                const epoch = Number(this.tx.epoch) || 1;

                const netOsms = (coins / epoch) * 0.9;

                const formattedOsms = parseFloat(netOsms.toFixed(4));
                amountStr = `${formattedOsms} OSMS`;
            }
        }

        const iconSize = h * 0.65;
        const {textureKey, scale} = selectTextureAndScale(this.scene, iconKey, iconSize);

        const icon = this.scene.add.image(35, centerY, textureKey).setScale(scale);
        this.add(icon);

        const topTextY = centerY - 10;
        const bottomTextY = centerY + 12;

        const textLeftX = 70;
        const typeText = this.scene.add.text(textLeftX, topTextY, typeStr, STYLES.type).setOrigin(0, 0.5);

        let hashStr = '';
        if (this.tx.status === 'REFUNDED') {
            hashStr = 'Cancelled';
        } else if (hasHash) {
            const shortHash = `${this.tx.transactionHash.slice(0, 6)}...${this.tx.transactionHash.slice(-4)}`;
            hashStr = `Tx Hash: ${shortHash}`;
        } else {
            hashStr = 'Processing...';
        }

        if (this.tx.epoch) hashStr += ` | Epoch ${this.tx.epoch}`;

        const hashText = this.scene.add.text(textLeftX, bottomTextY, hashStr, STYLES.hash).setOrigin(0, 0.5);
        this.add([typeText, hashText]);

        const rightX = w - 20;
        const amountText = this.scene.add.text(rightX, topTextY, amountStr, STYLES.amount).setOrigin(1, 0.5);

        const statusLabel = this.tx.status === 'RESERVED' ? 'PENDING' : this.tx.status;
        const statusColor = STATUS_COLORS[this.tx.status] || '#ffffff';
        const dateStr = Utils.formatDate(this.tx.createdAt);

        const statusText = this.scene.add.text(rightX, bottomTextY, `${statusLabel} • ${dateStr}`, {
            ...STYLES.status,
            color: statusColor
        }).setOrigin(1, 0.5);

        this.add([amountText, statusText]);

        if (hasHash) {
            const hitArea = this.scene.add.zone(w / 2, h / 2, w, h);
            hitArea.setInteractive({useHandCursor: true});
            this.add(hitArea);

            hitArea.on('pointerover', () => {

                bg.clear().fillStyle(0x2c2f38, 1).fillRoundedRect(0, 0, w, h, 8);
            });

            hitArea.on('pointerout', () => {

                bg.clear().fillStyle(0x1A1325, 0.8).fillRoundedRect(0, 0, w, h, 8);
            });

            hitArea.on('pointerdown', () => {
                navigator.clipboard.writeText(this.tx.transactionHash);
                this.scene.sysMessageContainer.addMessage('Tx Hash copied!', 'SUCCESS');
            });
        }
    }
}