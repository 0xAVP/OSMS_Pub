import Phaser from 'phaser';
import {ethers} from 'ethers';
import {ActionButton} from '../../../components/ActionButton.js';
import {QuantityInput} from '../../../components/qinput';
import {findInventoryItem, updateInventoryLocally} from '../../../actionUtils.js';
import {claimTokens, getMintingStatusFromContract} from '../../../processing/tokenClaimHandler.js';
import {selectTextureAndScale} from '../../../../../core/utils.js';
import {getInventory} from '../../../../wallet/inventory.js';

const STYLES = {
    headerTitle: {fontFamily: 'Tektur', fontSize: '22px', color: '#FEBA00', fontStyle: 'bold'},

    dashLabel: {fontFamily: 'Tektur', fontSize: '12px', color: '#888888'},

    dashValueBig: {fontFamily: 'Tektur', fontSize: '26px', color: '#ffffff', fontStyle: 'bold'},

    dashValueGold: {fontFamily: 'Tektur', fontSize: '26px', color: '#FEBA00', fontStyle: 'bold'},
    dashValueInfo: {fontFamily: 'Tektur', fontSize: '20px', color: '#41C6FF'},
    dashValueGreen: {fontFamily: 'Tektur', fontSize: '20px', color: '#42DA9D'},

    resourceLabel: {fontFamily: 'Tektur', fontSize: '14px', color: '#a0a0a0'},
    resourceValue: {fontFamily: 'Tektur', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'},

    inputLabel: {fontFamily: 'Tektur', fontSize: '16px', color: '#cccccc'},

    summaryLabel: {fontFamily: 'Tektur', fontSize: '14px', color: '#888888'},
    summaryValue: {fontFamily: 'Tektur', fontSize: '14px', color: '#cccccc'},
    netLabel: {fontFamily: 'Tektur', fontSize: '16px', color: '#FEBA00'},
    netValue: {fontFamily: 'Tektur', fontSize: '20px', color: '#FEBA00', fontStyle: 'bold'},

    helpIcon: {fontFamily: 'Tektur', fontSize: '16px', color: '#41C6FF'},
    error: {color: '#FF4D4D'},
    success: {color: '#42DA9D'}
};

const LAYOUT = {
    PADDING: 20,
    SECTION_GAP: 15,
};

const REFRESH_INTERVAL = 10000;

function updateTextToFit(textObj, text, maxWidth) {
    textObj.setText(text);
    textObj.setScale(1);
    if (textObj.width > maxWidth) {
        textObj.setScale(maxWidth / textObj.width);
    }
}

export class WithdrawView extends Phaser.GameObjects.Container {
    constructor(scene, width, height) {
        super(scene, 0, 0);
        this.panelWidth = width;
        this.panelHeight = height;

        this.currentCoins = 0;
        this.mintStatus = {
            epoch: 1,
            maxMintAmountWei: 0n,
            cooldownSeconds: 0,
            lastMintTime: 0,
            cumulativeMinted: 0,
            epochStep: 100000
        };

        this._createUI();

        this.scene.events.on('inventory-updated', this.updateInventoryData, this);

        this.refreshTimer = this.scene.time.addEvent({
            delay: REFRESH_INTERVAL,
            callback: this.refreshAllData,
            callbackScope: this,
            loop: true
        });

        this.on('destroy', () => {
            this.scene.events.off('inventory-updated', this.updateInventoryData, this);
            if (this.refreshTimer) this.refreshTimer.remove();
        });

        this.refreshAllData();
    }

    _createUI() {
        const centerX = this.panelWidth / 2;
        let currentY = 10;

        const {textureKey: tokenIconKey, scale: tokenScale} = selectTextureAndScale(this.scene, 'osms_token', 60);

        const glow = this.scene.add.image(centerX, currentY + 30, 'projection_disc_glow')
            .setDisplaySize(300, 100).setTint(0xFEBA00).setAlpha(0.3);

        const tokenIcon = this.scene.add.image(centerX, currentY + 25, tokenIconKey).setScale(tokenScale);
        const titleText = this.scene.add.text(centerX, currentY + 70, 'MINT OSMS TOKENS', STYLES.headerTitle).setOrigin(0.5);

        this.add([glow, tokenIcon, titleText]);
        currentY += 100;

        const statusHeight = 140;
        const statusBg = this.scene.add.graphics();

        statusBg.fillStyle(0x0a0a0a, 0.6)
            .fillRoundedRect(LAYOUT.PADDING, currentY, this.panelWidth - LAYOUT.PADDING * 2, statusHeight, 12)
            .lineStyle(1, 0x333333, 1)
            .strokeRoundedRect(LAYOUT.PADDING, currentY, this.panelWidth - LAYOUT.PADDING * 2, statusHeight, 12);

        const midX = this.panelWidth / 2;
        const midY = currentY + (statusHeight / 2);

        statusBg.lineStyle(1, 0x333333, 0.5);
        statusBg.lineBetween(midX, currentY + 15, midX, currentY + statusHeight - 15);
        statusBg.lineBetween(LAYOUT.PADDING + 15, midY, this.panelWidth - LAYOUT.PADDING - 15, midY);

        this.add(statusBg);

        const leftColX = LAYOUT.PADDING + (midX - LAYOUT.PADDING) / 2;
        const rightColX = midX + (this.panelWidth - LAYOUT.PADDING - midX) / 2;

        const topRowY = currentY + 35;

        const botRowY = currentY + statusHeight - 35;

        const labelOffsetY = -15;
        const valueOffsetY = 12;

        this.epochLabel = this.scene.add.text(leftColX, topRowY + labelOffsetY, 'CURRENT EPOCH', STYLES.dashLabel).setOrigin(0.5);

        const epochHelpIcon = this.scene.add.text(this.epochLabel.x + this.epochLabel.width / 2 + 8, topRowY + labelOffsetY, '  (?)', STYLES.helpIcon)
            .setOrigin(0.5)
            .setInteractive({useHandCursor: true});

        epochHelpIcon.on('pointerover', (pointer) => {
            this.scene.tooltip.show(pointer.x, pointer.y, {
                name: 'Minting Epoch',
                description: 'The Epoch determines the mining difficulty.\n\nRate: 1 Coin = 1 / Epoch Tokens.\n\nAs more tokens are mined globally, the Epoch increases, reducing the output per Coin.'
            });
        });
        epochHelpIcon.on('pointerout', () => this.scene.tooltip.hide());

        this.epochValue = this.scene.add.text(leftColX, topRowY + valueOffsetY, '#1', STYLES.dashValueBig).setOrigin(0.5);

        this.rateLabel = this.scene.add.text(rightColX, topRowY + labelOffsetY, 'EXCHANGE RATE', STYLES.dashLabel).setOrigin(0.5);
        this.rateValue = this.scene.add.text(rightColX, topRowY + valueOffsetY, '1 : 1', STYLES.dashValueGold).setOrigin(0.5);

        this.totalLabel = this.scene.add.text(leftColX, botRowY + labelOffsetY, 'TOTAL MINTED', STYLES.dashLabel).setOrigin(0.5);
        this.totalValue = this.scene.add.text(leftColX, botRowY + valueOffsetY, '0', STYLES.dashValueInfo).setOrigin(0.5);

        this.nextLabel = this.scene.add.text(rightColX, botRowY + labelOffsetY, 'NEXT EPOCH IN', STYLES.dashLabel).setOrigin(0.5);
        this.nextValue = this.scene.add.text(rightColX, botRowY + valueOffsetY, '...', STYLES.dashValueGreen).setOrigin(0.5);

        this.add([
            this.epochLabel, epochHelpIcon, this.epochValue,
            this.rateLabel, this.rateValue,
            this.totalLabel, this.totalValue,
            this.nextLabel, this.nextValue
        ]);

        currentY += statusHeight + LAYOUT.SECTION_GAP;

        const resBgHeight = 70;
        const resBg = this.scene.add.graphics();
        resBg.fillStyle(0x2c2f38, 0.5)
            .fillRoundedRect(LAYOUT.PADDING + 10, currentY, this.panelWidth - (LAYOUT.PADDING + 10) * 2, resBgHeight, 12);
        this.add(resBg);

        const {textureKey: coinIconKey, scale: coinScale} = selectTextureAndScale(this.scene, 'osms_coin', 50);
        const coinIcon = this.scene.add.image(LAYOUT.PADDING + 50, currentY + resBgHeight / 2, coinIconKey).setScale(coinScale);

        const textStartX = LAYOUT.PADDING + 100;
        const coinLabel = this.scene.add.text(textStartX, currentY + 18, 'AVAILABLE COINS', STYLES.resourceLabel).setOrigin(0, 0.5);
        this.coinValueText = this.scene.add.text(textStartX, currentY + 45, '0', STYLES.resourceValue).setOrigin(0, 0.5);

        this.add([coinIcon, coinLabel, this.coinValueText]);
        currentY += resBgHeight + LAYOUT.SECTION_GAP + 10;

        const inputLabel = this.scene.add.text(0, 0, 'Coins to Spend:', STYLES.inputLabel).setOrigin(0.5);
        const refundHelpIcon = this.scene.add.text(inputLabel.width / 2 + 10, 0, ' (?)', STYLES.helpIcon)
            .setOrigin(0.5)
            .setInteractive({useHandCursor: true});

        refundHelpIcon.on('pointerover', (pointer) => {
            this.scene.tooltip.show(pointer.x, pointer.y, {
                name: 'Transaction Safety',
                description: 'Coins are deducted immediately to reserve the minting slot.\n\nIf you reject the transaction or it fails, coins will be automatically returned withing ~1 hour via System Mail.'
            });
        });
        refundHelpIcon.on('pointerout', () => this.scene.tooltip.hide());

        const inputHeaderContainer = this.scene.add.container(centerX, currentY, [inputLabel, refundHelpIcon]);
        this.add(inputHeaderContainer);

        currentY += 45;

        this.quantityInput = new QuantityInput(this.scene, centerX, currentY, {
            width: 180, height: 50, buttonSize: 30, maxButtonWidth: 50, gap: 10,
            showMaxButton: true,
            minValue: 0,
            maxValue: 1000000,
            initialValue: 0,
            style: {
                fontFamily: 'Tektur',
                fontSize: '24px',
                textColor: '#FEBA00',
                bgColor: 0x111111,
                buttonBgColor: 0x333333,
                cornerRadius: 8
            }
        });

        this.quantityInput.on('change', (val) => this._updateCalculation(val));
        this.add(this.quantityInput);

        currentY += 45;

        const summaryBg = this.scene.add.graphics();
        summaryBg.lineStyle(2, 0x444444, 0.5);
        summaryBg.lineBetween(LAYOUT.PADDING * 2, currentY, this.panelWidth - LAYOUT.PADDING * 2, currentY);

        currentY += 15;
        const summaryLeftX = LAYOUT.PADDING + 30;
        const summaryRightX = this.panelWidth - LAYOUT.PADDING - 30;

        this.generatedLabel = this.scene.add.text(summaryLeftX, currentY, 'Gross Output:', STYLES.summaryLabel);
        this.generatedValue = this.scene.add.text(summaryRightX, currentY, '0 Tokens', STYLES.summaryValue).setOrigin(1, 0);

        currentY += 25;

        this.feeLabel = this.scene.add.text(summaryLeftX, currentY, 'Service Fee (10%):', STYLES.summaryLabel);
        this.feeValue = this.scene.add.text(summaryRightX, currentY, '0 Tokens', STYLES.summaryValue).setOrigin(1, 0);

        currentY += 30;

        this.netLabel = this.scene.add.text(summaryLeftX, currentY, 'YOU RECEIVE:', STYLES.netLabel);
        this.netValue = this.scene.add.text(summaryRightX, currentY, '0 Tokens', STYLES.netValue).setOrigin(1, 0);

        this.add([summaryBg, this.generatedLabel, this.generatedValue, this.feeLabel, this.feeValue, this.netLabel, this.netValue]);

        currentY += 70;

        this.actionButton = new ActionButton(this.scene, {
            x: centerX, y: currentY,
            texture: 'mint', text: '', scale: 1, cooldown: 2000
        });

        this.actionButton.on('click', () => this._handleMint());
        this.actionButton.disable();

        this.add(this.actionButton);
    }

    async refreshAllData() {
        if (!this.scene || !this.active) return;
        const status = await getMintingStatusFromContract(this.scene);

        if (status) {
            this.mintStatus = status;

            this.epochLabel.setColor('#888888');
            this.epochValue.setText(`#${this.mintStatus.epoch}`);

            const total = Math.floor(this.mintStatus.cumulativeMinted);
            updateTextToFit(this.totalValue, total.toLocaleString(), 120);

            const step = this.mintStatus.epochStep || 100000;
            const nextEpochThreshold = this.mintStatus.epoch * step;
            const remaining = Math.max(0, nextEpochThreshold - total);

            updateTextToFit(this.nextValue, remaining.toLocaleString(), 120);
            this.rateValue.setText(`1 : ${this.mintStatus.epoch}`);
        } else {
            this.epochLabel.setColor('#FF4D4D');
            this.epochValue.setText('OFF');
            this.totalValue.setText('---');
            this.rateValue.setText('---');
            this.nextValue.setText('---');
        }

        this.updateInventoryData();
    }

    updateInventoryData() {
        if (!this.scene.inventoryItems) return;

        this.currentCoins = findInventoryItem(this.scene, this.scene.inventoryItems, 'osms_coin') || 0;
        updateTextToFit(this.coinValueText, this.currentCoins.toLocaleString(), 100);

        let contractLimitInCoins = Infinity;

        if (this.mintStatus && this.mintStatus.maxMintAmountWei) {
            try {

                const maxMintWei = BigInt(this.mintStatus.maxMintAmountWei);

                const epoch = BigInt(Math.max(1, this.mintStatus.epoch));

                const weiUnit = ethers.parseUnits("1", 18);

                const maxAllowedCoinsBigInt = (maxMintWei * epoch) / weiUnit;

                contractLimitInCoins = Number(maxAllowedCoinsBigInt);

                console.log(`[WithdrawView] Epoch: ${epoch}, Contract Limit (Tokens): ${ethers.formatEther(maxMintWei)}, Max Coins Allowed: ${contractLimitInCoins}`);

            } catch (e) {
                console.warn('Error calculating contract limit:', e);
            }
        }

        const finalMax = Math.min(this.currentCoins, contractLimitInCoins);

        this.quantityInput.setDynamicMax(finalMax);

        this._updateCalculation(this.quantityInput.getValue());
    }

    _updateCalculation(coinsAmount) {
        if (coinsAmount <= 0) {
            this.generatedValue.setText('0 Tokens');
            this.feeValue.setText('0 Tokens');
            this.netValue.setText('0 Tokens');
            this.actionButton.disable();
            return;
        }

        const epoch = Math.max(1, this.mintStatus.epoch);
        const rawTokens = coinsAmount / epoch;

        const fee = rawTokens * 0.1;
        const net = rawTokens - fee;

        const fmt = {maximumFractionDigits: 4};

        this.generatedValue.setText(`${rawTokens.toLocaleString(undefined, fmt)} Tokens`);
        this.feeValue.setText(`-${fee.toLocaleString(undefined, fmt)} Tokens`);
        this.netValue.setText(`${net.toLocaleString(undefined, fmt)} Tokens`);

        if (this.currentCoins >= coinsAmount) {
            this.actionButton.enable();
        } else {
            this.actionButton.disable();
        }
    }

    _handleMint() {
        const coinsToBurn = this.quantityInput.getValue();
        if (coinsToBurn <= 0) return;

        const currentVisibleEpoch = this.mintStatus.epoch;

        const mintOperation = async () => {

            updateInventoryLocally(this.scene, [{
                itemId: 'osms_coin',
                category: 'other',
                quantityToDecrement: coinsToBurn
            }]);

            try {

                await claimTokens(this.scene, coinsToBurn, currentVisibleEpoch);
                await this.refreshAllData();
                this.quantityInput.setValue(0);
            } catch (error) {
                console.error("Mint failed:", error);

                await getInventory.call(this.scene);

                if (error.message && error.message.includes('Epoch changed')) {
                    await this.refreshAllData();
                }

                throw error;
            }
        };

        this.actionButton.trackPromise(mintOperation());
    }
}