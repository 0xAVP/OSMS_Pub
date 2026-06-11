import {selectTextureAndScale} from '../../../core/utils.js';

const BASE_WIDTH = 1920;
const NAV_ICON_SIZE = 50;
const BASE_NAV_Y_OFFSET = 40;
const FIXED_ICON_GAP = 30;
const HOVER_SCALE_MULTIPLIER = 1.08;
const DEFAULT_NAV_DEPTH = 10;

const BASE_SUBITEM_GAP = 60;
const BASE_SUBITEM_START_OFFSET = 40;

const BADGE_CONFIG = {
    strokeColor: 0xFEBA00,
    strokeWidth: 2,
    fillColor: 0x000000,
    fillAlpha: 0.6,
    cornerRadius: 6,
    fontSize: 14,
    paddingX: 6,
    minSize: 22,
    xOffset: 20,
    yOffset: -20
};

function handleNavClick(scene, buttonLabel) {
    const panelId = buttonLabel.toLowerCase().split('.')[0];
    console.log('handleNavClick triggered for panelId:', panelId);

    if (panelId === 'ship' && (!scene.ships || scene.ships.length === 0)) {
        scene.sysMessageContainer.addMessage('You need at least one ship to access this panel.', 'WARNING');
        return;
    }

    if (scene.sidePanelManager && scene.sidePanelManager.panelConfigs.has(panelId)) {
        if (scene.sidePanelManager.isOpen(panelId)) {
            scene.sidePanelManager.close(panelId);
        } else {
            scene.sidePanelManager.open(panelId);
        }
        scene.events.emit('navigationButtonClicked');
    } else {
        console.log(`No action defined for panel: "${panelId}"`);
    }
}

export function createNavContainer() {
    this.navContainer = this.add.container(0, 0).setDepth(DEFAULT_NAV_DEPTH);
    this.uiElements.push({name: 'container', element: this.navContainer});

    const navIconsData = [
        {label: 'Craft', key: 'ic_craft'},
        {label: 'Upgrade', key: 'ic_upgrade'},
        {label: 'Barter Hub. Soon', key: 'ic_market'},
        {label: 'Ship', key: 'ic_ship'},
        {label: 'Inventory', key: 'ic_inventory'},
        {
            label: 'Skills. Soon',
            key: 'ic_pilot',
            subItems: [
                {label: 'Leaderboard', key: 'ic_leaderboard'},
                {label: 'Account', key: 'ic_account'}
            ]
        },
        {label: 'Mail', key: 'ic_mail'}
    ];

    this.navButtons = [];
    this.subItemButtons = [];

    const BASE_PADDING_X = 16;
    const BASE_PADDING_Y = 10;
    const BASE_FONT_SIZE = 16;
    const CORNER_RADIUS = {tl: 5, tr: 5, bl: 5, br: 5};
    const BG_COLOR = 0x2c2f38;
    const BG_ALPHA = 0.95;
    const TEXT_COLOR = '#e0e0e0';

    const tooltipDisplayContainer = this.add.container(0, 0)
        .setDepth(DEFAULT_NAV_DEPTH + 1)
        .setVisible(false)
        .setName('navTooltip');

    const tooltipBackground = this.add.graphics();
    const tooltipText = this.add.text(0, 0, '', {fontFamily: 'Tektur'}).setOrigin(0.5, 0.5);
    tooltipDisplayContainer.add([tooltipBackground, tooltipText]);
    this.navContainer.add(tooltipDisplayContainer);

    const showTooltip = (label) => {
        const scaleFactor = this.adjustedWidth / BASE_WIDTH;
        const currentFontSize = Math.max(12, Math.round(BASE_FONT_SIZE * scaleFactor));
        const currentPaddingX = Math.max(8, BASE_PADDING_X * scaleFactor);
        const currentPaddingY = Math.max(5, BASE_PADDING_Y * scaleFactor);
        tooltipText.setStyle({
            fontFamily: 'Tektur',
            fontSize: `${currentFontSize}px`,
            color: TEXT_COLOR,
            align: 'center'
        });
        tooltipText.setText(label);
        const textBounds = tooltipText.getBounds();
        const bgWidth = textBounds.width + currentPaddingX * 2;
        const bgHeight = textBounds.height + currentPaddingY * 2;
        tooltipBackground.clear().fillStyle(BG_COLOR, BG_ALPHA).fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, CORNER_RADIUS);
        this.tweens.killTweensOf(tooltipDisplayContainer);
        tooltipDisplayContainer.setAlpha(0).setScale(0.95).setVisible(true);
        this.tweens.add({targets: tooltipDisplayContainer, alpha: 1, scale: 1, duration: 200, ease: 'Sine.easeOut'});
    };

    const hideTooltip = () => {
        this.tweens.killTweensOf(tooltipDisplayContainer);
        this.tweens.add({
            targets: tooltipDisplayContainer, alpha: 0, scale: 0.95, duration: 150, ease: 'Sine.easeIn',
            onComplete: () => {
                tooltipDisplayContainer.setVisible(false);
            }
        });
    };

    navIconsData.forEach((iconData) => {

        const {textureKey, scale} = selectTextureAndScale(this, iconData.key, NAV_ICON_SIZE);

        const button = this.add.image(0, 0, textureKey)
            .setScale(scale)
            .setInteractive({useHandCursor: true})
            .setDepth(1);

        button.setData('baseTextureKey', iconData.key);

        const panelId = iconData.label.toLowerCase().split('.')[0];

        if (this.sidePanelManager && this.sidePanelManager.panelConfigs.has(panelId)) {
            this[`${panelId}Button`] = button;
        }

        if (iconData.key === 'ic_mail') {
            this.mailButton = button;
        }

        button.on('pointerdown', () => handleNavClick(this, iconData.label));

        button.on('pointerover', () => {
            button.scale *= HOVER_SCALE_MULTIPLIER;
            showTooltip(iconData.label);
        });

        button.on('pointerout', () => {
            button.scale /= HOVER_SCALE_MULTIPLIER;
            hideTooltip();
        });

        this.navContainer.add(button);
        this.navButtons.push(button);

        if (iconData.subItems && iconData.subItems.length > 0) {
            button.setData('hideSubItemsTimer', null);

            const showSubItems = () => {
                const hideTimer = button.getData('hideSubItemsTimer');
                if (hideTimer) {
                    hideTimer.remove();
                    button.setData('hideSubItemsTimer', null);
                }

                const scaleFactor = this.scale.width / BASE_WIDTH;
                const currentGap = BASE_SUBITEM_GAP * scaleFactor;

                const subButtons = button.getData('subButtons') || [];
                subButtons.forEach((subButton, index) => {
                    if (!subButton.visible) {
                        subButton.setVisible(true);
                    }
                    this.tweens.killTweensOf(subButton);
                    this.tweens.add({
                        targets: subButton,
                        alpha: 1,
                        y: button.y + currentGap * (index + 1),
                        duration: 200,
                        ease: 'Sine.easeOut'
                    });
                });
            };

            const hideSubItems = () => {
                let hideTimer = button.getData('hideSubItemsTimer');
                if (hideTimer) hideTimer.remove();

                hideTimer = this.time.delayedCall(300, () => {
                    const scaleFactor = this.scale.width / BASE_WIDTH;
                    const startOffset = BASE_SUBITEM_START_OFFSET * scaleFactor;

                    const subButtons = button.getData('subButtons') || [];
                    subButtons.forEach((subButton) => {
                        if (!subButton || !subButton.scene) return;
                        this.tweens.killTweensOf(subButton);
                        this.tweens.add({
                            targets: subButton,
                            alpha: 0,
                            y: button.y + startOffset,
                            duration: 150,
                            ease: 'Sine.easeIn',
                            onComplete: () => {
                                if (subButton && subButton.scene) subButton.setVisible(false);
                            }
                        });
                    });
                });
                button.setData('hideSubItemsTimer', hideTimer);
            };

            const subButtonsList = [];
            iconData.subItems.forEach((subItemData) => {

                const {
                    textureKey: subTexture,
                    scale: subScale
                } = selectTextureAndScale(this, subItemData.key, NAV_ICON_SIZE);

                const subButton = this.add.image(0, 0, subTexture)
                    .setScale(subScale)
                    .setInteractive({useHandCursor: true})
                    .setDepth(0)
                    .setVisible(false)
                    .setAlpha(0);

                subButton.setData('baseTextureKey', subItemData.key);

                this.navContainer.add(subButton);
                subButtonsList.push(subButton);
                this.subItemButtons.push({parentButton: button, subButton: subButton});

                subButton.on('pointerover', () => {
                    showSubItems();
                    subButton.scale *= HOVER_SCALE_MULTIPLIER;
                    showTooltip(subItemData.label);
                });
                subButton.on('pointerout', () => {
                    hideSubItems();
                    subButton.scale /= HOVER_SCALE_MULTIPLIER;
                    hideTooltip();
                });
                subButton.on('pointerdown', () => handleNavClick(this, subItemData.label));
            });

            button.setData('subButtons', subButtonsList);

            button.on('pointerover', showSubItems);
            button.on('pointerout', hideSubItems);
        }
    });

    this.mailBadge = this.add.container(0, 0).setDepth(20).setVisible(false);

    const badgeBg = this.add.graphics();
    const badgeText = this.add.text(0, 0, '0', {
        fontFamily: 'Tektur',
        fontSize: `${BADGE_CONFIG.fontSize}px`,
        color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    this.mailBadge.add([badgeBg, badgeText]);
    this.mailBadge.badgeBg = badgeBg;
    this.mailBadge.textObject = badgeText;

    this.navContainer.add(this.mailBadge);

    const redrawBadgeBg = (text) => {
        badgeText.setText(text);
        const textWidth = badgeText.width;
        const width = Math.max(BADGE_CONFIG.minSize, textWidth + BADGE_CONFIG.paddingX * 2);
        const height = BADGE_CONFIG.minSize;

        badgeBg.clear();
        badgeBg.fillStyle(BADGE_CONFIG.fillColor, BADGE_CONFIG.fillAlpha);
        badgeBg.fillRoundedRect(-width / 2, -height / 2, width, height, BADGE_CONFIG.cornerRadius);
        badgeBg.lineStyle(BADGE_CONFIG.strokeWidth, BADGE_CONFIG.strokeColor, 1);
        badgeBg.strokeRoundedRect(-width / 2, -height / 2, width, height, BADGE_CONFIG.cornerRadius);
    };

    this.updateMailBadgeCount = () => {
        if (!this.mailData || !this.mailData.inbox) {
            this.mailBadge.setVisible(false);
            return;
        }

        const unreadCount = this.mailData.inbox.filter(mail => !mail.isRead).length;

        if (unreadCount > 0) {
            this.mailBadge.setVisible(true);
            const countText = unreadCount > 99 ? '99+' : unreadCount.toString();

            redrawBadgeBg(countText);

            this.tweens.add({
                targets: this.mailBadge,
                scale: {from: 1.2, to: 1},
                duration: 200,
                ease: 'Back.easeOut'
            });
        } else {
            this.mailBadge.setVisible(false);
        }
    };

    this.events.on('mail-list-changed', this.updateMailBadgeCount, this);
    this.updateMailBadgeCount();

    this.events.once('destroy', () => {
        this.events.off('mail-list-changed', this.updateMailBadgeCount, this);
    });
}

export function updateNavContainer(adjustedWidth, adjustedHeight) {
    if (!this.navContainer || !this.navButtons || this.navButtons.length === 0) return;

    const scaleMultiplier = adjustedWidth / BASE_WIDTH;
    const currentNavY = BASE_NAV_Y_OFFSET * scaleMultiplier;
    this.navContainer.setPosition(adjustedWidth / 2, currentNavY);

    const targetIconSize = NAV_ICON_SIZE * scaleMultiplier;
    const currentGap = FIXED_ICON_GAP * scaleMultiplier;

    let totalNavWidth = 0;
    const buttonWidths = [];

    this.navButtons.forEach((button, index) => {
        const baseKey = button.getData('baseTextureKey');
        const {textureKey, scale} = selectTextureAndScale(this, baseKey, targetIconSize);

        button.setTexture(textureKey);
        button.setScale(scale);

        const displayWidth = button.displayWidth;
        buttonWidths[index] = displayWidth;

        totalNavWidth += displayWidth;
    });

    totalNavWidth += (this.navButtons.length - 1) * currentGap;
    const navStartX = -totalNavWidth / 2;

    let accumulatedWidth = 0;
    this.navButtons.forEach((button, index) => {
        const displayWidth = buttonWidths[index];
        button.setX(navStartX + accumulatedWidth + (displayWidth / 2));
        accumulatedWidth += displayWidth + currentGap;
    });

    const currentSubItemGap = BASE_SUBITEM_GAP * scaleMultiplier;
    const currentSubItemStartOffset = BASE_SUBITEM_START_OFFSET * scaleMultiplier;

    this.subItemButtons.forEach(({parentButton, subButton}) => {

        const subBaseKey = subButton.getData('baseTextureKey');
        const {textureKey, scale} = selectTextureAndScale(this, subBaseKey, targetIconSize);
        subButton.setTexture(textureKey);
        subButton.setScale(scale);

        subButton.setX(parentButton.x);

        const siblings = parentButton.getData('subButtons');
        const index = siblings ? siblings.indexOf(subButton) : 0;

        if (subButton.visible && subButton.alpha > 0.1) {
            subButton.setY(parentButton.y + currentSubItemGap * (index + 1));
        } else {
            subButton.setY(parentButton.y + currentSubItemStartOffset);
        }
    });

    if (this.mailButton && this.mailBadge) {
        const xOffset = BADGE_CONFIG.xOffset * scaleMultiplier;
        const yOffset = BADGE_CONFIG.yOffset * scaleMultiplier;

        this.mailBadge.setPosition(
            this.mailButton.x + xOffset,
            this.mailButton.y + yOffset
        );
        this.mailBadge.setScale(Math.max(0.8, scaleMultiplier));
    }

    const tooltipContainer = this.navContainer.getByName('navTooltip');
    if (tooltipContainer) {
        const BASE_TOOLTIP_Y_OFFSET = 55;
        tooltipContainer.y = BASE_TOOLTIP_Y_OFFSET * scaleMultiplier / this.navContainer.scaleY;
    }
}
