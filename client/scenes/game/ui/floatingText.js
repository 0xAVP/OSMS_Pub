import Phaser from 'phaser';
import {DEPTHS} from "./depths";

const FLOATING_TEXT_STYLE = {
    fontFamily: 'Orbitron',
    stroke: '#000000',
    strokeThickness: 4,
};

const COLOR_MAP = {
    orange: '#ffa500',
    cyan: '#00ffff',
    white: '#ffffff',
    red: '#ff4444',
    green: '#42DA9D'
};

/**
 * Создает и анимирует плавающий текст с настраиваемым размером шрифта.
 * @param {Phaser.Scene} scene - Сцена.
 * @param {number} x - Координата X.
 * @param {number} y - Координата Y.
 * @param {string} text - Отображаемый текст.
 * @param {string} colorKey - Ключ цвета.
 * @param {number} [fontSize=20] - Размер шрифта в пикселях.
 */
export function createFloatingText(scene, x, y, text, colorKey, fontSize = 20) {
    const textObject = scene.poolManager.spawn('floatingTexts');
    if (!textObject) return;

    const scaledFontSize = scene.scaleValue(fontSize);
    const dynamicStyle = {
        ...FLOATING_TEXT_STYLE,
        color: COLOR_MAP[colorKey] || COLOR_MAP.white,
        fontSize: `${scaledFontSize}px`,
        strokeThickness: scene.scaleValue(4)
    };

    textObject.setPosition(x, y).setText(text).setStyle(dynamicStyle).setAlpha(1).setScale(1);

    scene.tweens.add({
        targets: textObject,
        y: y - scene.scaleValue(50),
        alpha: {from: 1, to: 0},
        scale: {from: 1, to: 1.2},
        duration: 1200,
        ease: 'Power1',
        onComplete: () => {
            scene.poolManager.despawn('floatingTexts', textObject);
        }
    });
}

const BATCH_WINDOW_MS = 1500;
const DISPLAY_DURATION_MS = 2500;
const LINE_HEIGHT = 28;
const RARITY_COLORS = {
    default: '#e0e0e0',
    common: '#758BA0',
    uncommon: '#42DA9D',
    rare: '#41C6FF',
    epic: '#C029E5',
    legendary: '#FEBA00',
};

function showLootBatch(scene) {
    if (scene.lootNotificationQueue.length === 0) {
        scene.isShowingLootNotification = false;
        return;
    }

    scene.isShowingLootNotification = true;

    const aggregatedLoot = new Map();
    for (const item of scene.lootNotificationQueue) {

        aggregatedLoot.set(item.id, {
            name: item.name,
            rarity: item.rarity,
            amount: (aggregatedLoot.get(item.id)?.amount || 0) + item.amount
        });
    }

    scene.lootNotificationQueue.length = 0;

    const scaledPaddingRight = scene.scaleValue(20);
    const scaledPaddingBottom = scene.scaleValue(40);
    const scaledLineHeight = scene.scaleValue(LINE_HEIGHT);
    const scaledFontSize = scene.scaleValue(18);
    const scaledStrokeThickness = scene.scaleValue(2);

    const container = scene.add.container(scene.startWidth - scaledPaddingRight, scene.startHeight - scaledPaddingBottom)
        .setDepth(DEPTHS.UI_NOTIFICATIONS)
        .setAlpha(0);

    scene.tweens.add({
        targets: container,
        alpha: 0.85,
        duration: 250,
        ease: 'Power1'
    });

    let currentY = 0;

    for (const [id, data] of aggregatedLoot) {
        const displayText = `+${data.amount} ${data.name}`;
        const color = RARITY_COLORS[data.rarity] || RARITY_COLORS.common;

        const textObject = scene.add.text(0, currentY, displayText, {
            fontFamily: 'Tektur',
            fontSize: `${scaledFontSize}px`,
            color: color,
            stroke: '#000000',
            strokeThickness: scaledStrokeThickness,
            align: 'right'
        }).setOrigin(1, 1);

        container.add(textObject);
        currentY -= scaledLineHeight;
    }

    scene.tweens.add({
        targets: container,
        alpha: 0,
        delay: DISPLAY_DURATION_MS,
        duration: 500,
        ease: 'Power1',
        onComplete: () => {
            container.destroy();
            scene.isShowingLootNotification = false;
            if (scene.lootNotificationQueue.length > 0) {
                showLootBatch(scene);
            }
        }
    });
}

/**
 * Добавляет лут в пакет и управляет таймером.
 * @param {Phaser.Scene} scene - Сцена.
 * @param {{key: string, name: string}} itemData - Данные о предмете.
 * @param {number} amount - Количество.
 */
export function addLootNotification(scene, itemData, amount) {

    scene.lootNotificationQueue.push({
        id: itemData.key,
        name: itemData.name,
        amount: amount,
        rarity: itemData.rarity
    });

    if (scene.lootBatchTimer) {
        return;
    }

    scene.lootBatchTimer = scene.time.delayedCall(BATCH_WINDOW_MS, () => {

        scene.lootBatchTimer = null;

        if (!scene.isShowingLootNotification) {
            showLootBatch(scene);
        }
    });
}