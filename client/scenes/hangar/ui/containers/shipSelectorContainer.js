const offsetY = 40;
const PADDING = -30;
const ARROW_OFFSET_Y = 4;
const TEXT_OFFSET_Y = 4;

/**
 * Создает элементы селектора кораблей и добавляет их в deskContainer.
 * @this Phaser.Scene - Контекст текущей сцены.
 */
export function createShipSelectorElements() {
    const deskContainer = this.deskContainer;
    if (!deskContainer) {
        console.warn('deskContainer is not available, skipping ship selector creation');
        return;
    }

    const selectorY = -deskContainer.desk.height + offsetY;

    const selectorCenterX = 0;

    const deskTexture = this.textures.get('desk@1x');
    const deskBaseWidth = deskTexture.source[0].width;
    const arrowOffsetX = deskBaseWidth / 8;

    this.shipLeftArrow = this.add.image(selectorCenterX - arrowOffsetX, selectorY + ARROW_OFFSET_Y, 'arrowL')
        .setInteractive({useHandCursor: true})
        .setScale(2)
        .setDepth(6);
    this.shipRightArrow = this.add.image(selectorCenterX + arrowOffsetX, selectorY + ARROW_OFFSET_Y, 'arrowR')
        .setInteractive({useHandCursor: true})
        .setScale(2)
        .setDepth(6);

    this.shipNameText = this.add.text(selectorCenterX, selectorY + TEXT_OFFSET_Y, '', {
        fontFamily: 'Tektur',
        fontSize: '34px',
        color: '#FEBA00',
        align: 'center'
    }).setOrigin(0.5).setDepth(6);

    deskContainer.add([this.shipLeftArrow, this.shipRightArrow, this.shipNameText]);

    this.shipLeftArrow.on('pointerdown', () => this.selectShip(-1));
    this.shipRightArrow.on('pointerdown', () => this.selectShip(1));
    this.shipLeftArrow.on('pointerover', () => this.shipLeftArrow.setScale(2.2));
    this.shipRightArrow.on('pointerover', () => this.shipRightArrow.setScale(2.2));
    this.shipLeftArrow.on('pointerout', () => this.shipLeftArrow.setScale(2));
    this.shipRightArrow.on('pointerout', () => this.shipRightArrow.setScale(2));
}

/**
 * Обновляет текст и состояние элементов селектора кораблей.
 * @this Phaser.Scene - Контекст текущей сцены.
 */
export function updateShipSelectorElements() {
    if (!this.shipLeftArrow || !this.shipRightArrow || !this.shipNameText) {
        return;
    }

    if (this.ships.length === 0 || !this.selectedShip) {

        this.shipNameText.setText('No ships available. Please mint one.');

        this.shipNameText.setColor('#FF9999');

        this.shipLeftArrow.setAlpha(0.5).disableInteractive();
        this.shipRightArrow.setAlpha(0.5).disableInteractive();

    } else {

        this.shipNameText.setColor('#FEBA00');

        if (this.ships.length <= 1) {
            this.shipLeftArrow.setAlpha(0.5).disableInteractive();
            this.shipRightArrow.setAlpha(0.5).disableInteractive();
        } else {
            this.shipLeftArrow.setAlpha(1).setInteractive();
            this.shipRightArrow.setAlpha(1).setInteractive();
        }

        const shipName = this.selectedShip.type || 'Unknown Ship';
        const shipId = this.selectedShip.shipId;
        const hullHp = this.selectedShip.hull || '-';
        this.shipNameText.setText(`${shipName} #${shipId}   |   Hull: ${hullHp}`);
    }
}