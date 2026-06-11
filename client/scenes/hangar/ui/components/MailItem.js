import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../core/utils.js';
import {getCatalogData} from '../../wallet/catalog.js';
import {ActionButton} from './ActionButton.js';
import {Utils} from '../../../core/utils.js';

const STYLES = {
    subject: {fontFamily: 'Tektur', fontSize: '15px', color: '#ffffff', lineSpacing: 4},
    address: {fontFamily: 'Tektur', fontSize: '12px', color: '#a0a0a0'},
    date: {fontFamily: 'Tektur', fontSize: '12px', color: '#999999'},
    expires: {fontFamily: 'Tektur', fontSize: '12px', color: '#ff7f7f'},
};

const LAYOUT = {
    HEIGHT: 70,
    ICON_SIZE: 50,
    PADDING: 15,
    ICON_TEXT_GAP: 15,
    TEXT_DATE_GAP: 15,
    DATE_BUTTON_GAP: 15,
};

export class MailItem extends Phaser.GameObjects.Container {
    constructor(config) {
        const {scene, mailData, folder, width} = config;
        super(scene, 0, 0);
        this.setSize(width, LAYOUT.HEIGHT);

        this.mailData = mailData;
        this.folder = folder;

        this._createUI();
        this._attachEventListeners();
    }

    _createUI() {
        const width = this.width;
        const height = this.height;

        const bg = this.scene.add.graphics()
            .fillStyle(0x2c2f38, 0.5)
            .fillRoundedRect(0, 0, width, height, 5);
        this.add(bg);

        const iconX = LAYOUT.PADDING + (LAYOUT.ICON_SIZE / 2);
        const iconY = height / 2;

        const iconContainer = this.scene.add.container(iconX, iconY);

        const attachment = this.mailData.attachments?.[0];
        let iconKeyToShow = 'ic_mail';

        if (attachment) {

            iconKeyToShow = attachment.category === 'modules' ? attachment.data.key : attachment.itemKey;
        }

        const {textureKey, scale} = selectTextureAndScale(this.scene, iconKeyToShow, LAYOUT.ICON_SIZE * 0.8);
        const icon = this.scene.add.image(0, 0, textureKey).setScale(scale).setInteractive({useHandCursor: true});

        iconContainer.add([icon]);
        this.add(iconContainer);

        const button = this.mailData.hasAttachments && !this.mailData.attachmentsClaimed
            ? new ActionButton(this.scene, {texture: 'claim', scale: 0.7})
            : new ActionButton(this.scene, {texture: 'delete', scale: 0.7});

        const buttonX = width - LAYOUT.PADDING - (button.getBounds().width / 2);
        button.setPosition(buttonX, height / 2);
        this.add(button);

        if (this.mailData.hasAttachments && !this.mailData.attachmentsClaimed) {
            this.claimButton = button;
        } else {
            this.deleteButton = button;
        }

        const dateContainer = this.scene.add.container(0, 0);
        const dateText = this.scene.add.text(0, 0, Utils.formatDate(this.mailData.createdAt), STYLES.date).setOrigin(0.5, 0.5);
        const expiresText = this.scene.add.text(0, dateText.height, Utils.formatTimeToExpire(this.mailData.expiresAt), STYLES.expires).setOrigin(0.5, 0.5);
        dateContainer.add([dateText, expiresText]);

        const dateBlockWidth = Math.max(dateText.width, expiresText.width);
        const dateBlockX = buttonX - (button.getBounds().width / 2) - LAYOUT.DATE_BUTTON_GAP - (dateBlockWidth / 2);
        dateContainer.setPosition(dateBlockX, height / 2 - 2);
        this.add(dateContainer);

        const textStartX = iconX + (LAYOUT.ICON_SIZE / 2) + LAYOUT.ICON_TEXT_GAP;
        const textEndX = dateBlockX - (dateBlockWidth / 2) - LAYOUT.TEXT_DATE_GAP;
        const textAvailableWidth = textEndX - textStartX;

        if (textAvailableWidth <= 0) {
            console.error("MailListItem: Calculated width for text is zero or negative.");
            return;
        }

        const textContainer = this.scene.add.container(textStartX, height / 2);
        this.add(textContainer);

        const subjectText = this.scene.add.text(0, 0, this.mailData.subject, {
            ...STYLES.subject,
            wordWrap: {width: textAvailableWidth}
        }).setOrigin(0, 0.5);

        const address = this.folder === 'inbox' ? this.mailData.senderAddress : this.mailData.recipientAddress;
        const addressLabel = this.folder === 'inbox' ? 'From:' : 'To:';

        let shortAddress = 'Unknown';
        if (address) {
            shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        }

        const addressText = this.scene.add.text(0, 0, `${addressLabel} ${shortAddress}`, STYLES.address).setOrigin(0, 0.5);

        textContainer.add([subjectText, addressText]);

        const totalTextHeight = subjectText.height + addressText.height;
        subjectText.y = -(totalTextHeight / 2) + (subjectText.height / 2) - 2;
        addressText.y = subjectText.y + subjectText.height;

        this.ui = {icon, addressText, attachment, addressFull: address};
    }

    _attachEventListeners() {

        const attachment = this.ui.attachment;

        if (attachment) {
            this.ui.icon.on('pointerover', (pointer) => {
                const itemKey = attachment.category === 'modules' ? attachment.data.key : attachment.itemKey;
                const itemData = getCatalogData(this.scene, itemKey, attachment.category) || {};

                const tooltipData = {
                    name: itemData.name || itemKey,
                    quantity: attachment.data.quantity,
                    rarity: itemData.rarity
                };

                this.scene.tooltip.show(pointer.x, pointer.y, tooltipData);
            });
            this.ui.icon.on('pointerout', () => this.scene.tooltip.hide());
        }

        if (this.ui.addressText) {
            this.ui.addressText.setInteractive({useHandCursor: true});
            this.ui.addressText.on('pointerover', (pointer) => {
                this.scene.tooltip.show(pointer.x, pointer.y, {address: this.ui.addressFull});
            });
            this.ui.addressText.on('pointerout', () => this.scene.tooltip.hide());
        }

        if (this.claimButton) {
            this.claimButton.on('click', () => {
                this.claimButton.disable();
                this.emit('claim-clicked', this.mailData._id);
            });
        }
        if (this.deleteButton) {
            this.deleteButton.on('click', () => {
                this.deleteButton.disable();
                this.emit('delete-clicked', this.mailData._id, this.folder);
            });
        }
    }
}


