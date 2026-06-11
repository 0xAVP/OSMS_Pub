import {createItemTooltip} from './itemTooltip.js';

const BASE_WIDTH = 1920;
const CONFIG = {
    CONTAINER: {
        BASE_HEIGHT: 40,
        BASE_Y: 100,
        BASE_MIN_WIDTH: 300,
        BASE_MAX_WIDTH: 600,
        BASE_CORNER_RADIUS: 20,
        BASE_TEXT_PADDING: 20,
        BG_COLOR: 0x1A1325,
        BG_ALPHA: 1
    },
    MESSAGE: {
        DURATION: 3000,
        QUEUE_DURATION: 1000,
    },
    QUEUE_COUNT: {
        BASE_SIZE: 20,
        BASE_OFFSET: -10,
        BASE_FONT_SIZE: 12,
    },
    BASE_FONT_SIZE: 16,
};

const MESSAGE_STATES = {
    DEFAULT: {color: '#C4C6C8', bbcodePrefix: '[color=#C4C6C8]'},
    ERROR: {color: '#E663CB', bbcodePrefix: '[color=#E663CB]'},
    WARNING: {color: '#FEB813', bbcodePrefix: '[color=#FEB813]'},
    SUCCESS: {color: '#03BE61', bbcodePrefix: '[color=#03BE61]'},
};

function drawBackground(container, width, height, cornerRadius) {
    container.background.clear()
        .fillStyle(CONFIG.CONTAINER.BG_COLOR, CONFIG.CONTAINER.BG_ALPHA)
        .fillRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height,
            cornerRadius
        );
}

function updateQueueCounter(container, queueLength, containerWidth, containerHeight, size, offset, fontSize) {
    if (queueLength > 0) {
        container.queueCountText.setFontSize(fontSize).setText(queueLength.toString()).setVisible(true);
        container.queueCountBg.clear()
            .fillStyle(0x555555, 1)
            .fillRoundedRect(
                containerWidth / 2 - size + offset,
                -containerHeight / 2 - offset,
                size,
                size,
                size / 2
            );
        container.queueCountText.setPosition(
            containerWidth / 2 - size / 2 + offset,
            -containerHeight / 2 - offset + size / 2
        );
    } else {
        container.queueCountText.setVisible(false);
        container.queueCountBg.clear();
    }
}

export function createSysMessageContainer() {
    const scene = this;

    const container = scene.add.container(scene.scale.width / 2, CONFIG.CONTAINER.BASE_Y)
        .setDepth(1000)
        .setVisible(false);
    scene.uiElements.push(container);
    container.messages = [];
    container.messageQueue = [];
    container.isDisplaying = false;

    const itemTooltip = createItemTooltip(this, container, CONFIG.CONTAINER.BASE_HEIGHT);
    container.showTooltip = itemTooltip.showTooltip;
    container.hideTooltip = itemTooltip.hideTooltip;

    container.background = scene.add.graphics().setDepth(999);
    container.messagesContainer = scene.add.container(0, 0).setDepth(10);
    container.queueCountBg = scene.add.graphics().setDepth(1000);
    container.queueCountText = scene.add.text(0, 0, '0', {
        fontFamily: 'Tektur',
        align: 'center',
        alpha: 0.8,
        shadow: {offsetX: 1, offsetY: 1, color: '#000000', blur: 1, stroke: true, fill: true},
    }).setOrigin(0.5).setDepth(1001).setVisible(false);

    container.add([container.background, container.messagesContainer, container.queueCountBg, container.queueCountText]);

    const displayNextMessage = () => {
        if (container.isDisplaying || !container.messageQueue.length) return;
        container.isDisplaying = true;

        const {text, state = 'DEFAULT', duration, itemData} = container.messageQueue.shift();
        const messageState = MESSAGE_STATES[state.toUpperCase()] || MESSAGE_STATES.DEFAULT;

        const scaleFactor = scene.adjustedWidth / BASE_WIDTH;

        const currentHeight = CONFIG.CONTAINER.BASE_HEIGHT * scaleFactor;
        const currentY = CONFIG.CONTAINER.BASE_Y * scaleFactor;
        const currentCornerRadius = CONFIG.CONTAINER.BASE_CORNER_RADIUS * scaleFactor;
        const currentTextPadding = CONFIG.CONTAINER.BASE_TEXT_PADDING * scaleFactor;
        const currentFontSize = Math.max(12, Math.round(CONFIG.BASE_FONT_SIZE * scaleFactor));
        const currentMinWidth = CONFIG.CONTAINER.BASE_MIN_WIDTH * scaleFactor;
        const currentMaxWidth = CONFIG.CONTAINER.BASE_MAX_WIDTH * scaleFactor;
        const currentQueueSize = CONFIG.QUEUE_COUNT.BASE_SIZE * scaleFactor;
        const currentQueueOffset = CONFIG.QUEUE_COUNT.BASE_OFFSET * scaleFactor;
        const currentQueueFontSize = Math.max(10, Math.round(CONFIG.QUEUE_COUNT.BASE_FONT_SIZE * scaleFactor));

        const bbcodeText = `${messageState.bbcodePrefix}${text}[/color]`;

        const tempText = scene.add.rexBBCodeText(0, 0, bbcodeText, {
            fontFamily: 'Tektur',
            fontSize: `${currentFontSize}px`
        }).setVisible(false);
        const textWidth = tempText.width;
        tempText.destroy();

        const containerWidth = Math.min(Math.max(textWidth + currentTextPadding * 2, currentMinWidth), currentMaxWidth);

        container.setPosition(scene.adjustedWidth / 2, currentY);

        drawBackground(container, containerWidth, currentHeight, currentCornerRadius);
        updateQueueCounter(container, container.messageQueue.length, containerWidth, currentHeight, currentQueueSize, currentQueueOffset, currentQueueFontSize);

        container.setVisible(true);

        const messageText = scene.add.rexBBCodeText(0, 0, bbcodeText, {
            fontFamily: 'Tektur',
            fontSize: `${currentFontSize}px`,
            align: 'center',
            shadow: {offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true},
            wordWrap: {width: containerWidth - currentTextPadding * 2},
        }).setOrigin(0.5).setDepth(10);

        if (itemData && itemData.tooltipType) {
            messageText.setInteractive({useHandCursor: true})
                .on('pointerover', () => container.showTooltip(itemData, container.x, container.y))
                .on('pointerout', () => container.hideTooltip());
        }

        container.messagesContainer.removeAll(true).add(messageText);
        container.messages = [messageText];

        if (duration === 'infinite') {

            return;
        }

        const finalDuration = container.messageQueue.length ? CONFIG.MESSAGE.QUEUE_DURATION : (duration !== null ? duration : CONFIG.MESSAGE.DURATION);

        container.timer = scene.time.delayedCall(finalDuration, () => {

            container.isDisplaying = false;
            if (container.messagesContainer) {

                container.messagesContainer.each(child => child.destroy());
                container.messagesContainer.removeAll(true);
            }
            container.messages = [];
            container.setVisible(false);
            container.hideTooltip();
            displayNextMessage();
        });
    };

    container.addMessage = (text, state = 'DEFAULT', duration = null, itemData = null) => {
        if (container.isDisplaying) {
            container.isDisplaying = false;
            if (container.timer) {
                container.timer.remove();
                container.timer = null;
            }
        }

        if (!container || !container.messageQueue) {
            console.warn(`sysMessageContainer unavailable, message: ${text} (type: ${state})`);
            return;
        }
        container.messageQueue.push({text, state, duration, itemData});
        displayNextMessage();
    };

    container.clearMessages = () => {
        container.messages.forEach(message => message.destroy());
        container.messages = [];
        container.messageQueue = [];
        container.isDisplaying = false;
        container.setVisible(false);
        container.queueCountText.setVisible(false);
        container.queueCountBg.clear();
        if (container.timer) container.timer.remove();
        container.hideTooltip();
    };

    container.on('destroy', () => {

        itemTooltip.destroy();

        if (container.timer) {
            container.timer.remove();
            container.timer = null;
        }
        console.log('SysMessageContainer destroyed, tooltip and timer cleaned up.');
    });

    scene.sysMessageContainer = container;
    return container;
}

export function updateSysMessageContainer(adjustedWidth) {
    const container = this.sysMessageContainer;
    if (!container || !container.isDisplaying) {
        return;
    }
    const scene = this;

    const scaleFactor = adjustedWidth / BASE_WIDTH;

    const currentHeight = CONFIG.CONTAINER.BASE_HEIGHT * scaleFactor;
    const currentY = CONFIG.CONTAINER.BASE_Y * scaleFactor;
    const currentCornerRadius = CONFIG.CONTAINER.BASE_CORNER_RADIUS * scaleFactor;
    const currentTextPadding = CONFIG.CONTAINER.BASE_TEXT_PADDING * scaleFactor;
    const currentFontSize = Math.max(12, Math.round(CONFIG.BASE_FONT_SIZE * scaleFactor));
    const currentMinWidth = CONFIG.CONTAINER.BASE_MIN_WIDTH * scaleFactor;
    const currentMaxWidth = CONFIG.CONTAINER.BASE_MAX_WIDTH * scaleFactor;
    const currentQueueSize = CONFIG.QUEUE_COUNT.BASE_SIZE * scaleFactor;
    const currentQueueOffset = CONFIG.QUEUE_COUNT.BASE_OFFSET * scaleFactor;
    const currentQueueFontSize = Math.max(10, Math.round(CONFIG.QUEUE_COUNT.BASE_FONT_SIZE * scaleFactor));

    container.setPosition(adjustedWidth / 2, currentY);

    const message = container.messages[0];
    if (message) {
        message.setFontSize(`${currentFontSize}px`);
        const textWidth = message.width;
        const containerWidth = Math.min(Math.max(textWidth + currentTextPadding * 2, currentMinWidth), currentMaxWidth);

        message.setWordWrapWidth(containerWidth - currentTextPadding * 2);

        drawBackground(container, containerWidth, currentHeight, currentCornerRadius);
        updateQueueCounter(container, container.messageQueue.length, containerWidth, currentHeight, currentQueueSize, currentQueueOffset, currentQueueFontSize);
    }
}