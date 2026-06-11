import {getBuffDefinition} from '../../../shared/BuffService.js';

import {selectTextureAndScale} from '../../../core/utils.js';

/**
 * Создает и управляет контейнером для отображения иконок активных баффов.
 * @param {Phaser.Scene} scene - Текущая сцена.
 * @param {number} x - Позиция X контейнера.
 * @param {number} y - Позиция Y контейнера.
 * @returns {Phaser.GameObjects.Container}
 */
export function createBuffsContainer(scene, x, y) {
    const ICON_BG_SIZE = 60;
    const ICON_PADDING = 10;
    const ICON_SPACING = 20;

    const container = scene.add.container(x, y).setDepth(5);

    const updateBuffsDisplay = () => {
        container.removeAll(true);
        const activeBuffs = scene.registry.get('active_buffs') || {};

        const activeBuffsArray = Object.entries(activeBuffs).map(([buffId, activeBuff]) => {
            const buffDef = getBuffDefinition(scene, buffId);
            return {buffId, activeBuff, buffDef};
        }).filter(item => item.buffDef && item.buffDef.texture);

        if (activeBuffsArray.length === 0) {
            return;
        }

        const totalWidth = (activeBuffsArray.length * ICON_BG_SIZE) + ((activeBuffsArray.length - 1) * ICON_SPACING);

        let currentX = -totalWidth / 2;

        activeBuffsArray.forEach(({buffId, activeBuff, buffDef}) => {

            const elementCenterX = currentX + ICON_BG_SIZE / 2;

            const buffElementContainer = scene.add.container(elementCenterX, 0);

            const {
                textureKey: bgTextureKey,
                scale: bgScale
            } = selectTextureAndScale(scene, 'factory_line_item_bg', ICON_BG_SIZE);
            const bg = scene.add.image(0, 0, bgTextureKey).setScale(bgScale).setOrigin(0.5);
            buffElementContainer.add(bg);

            const iconSize = ICON_BG_SIZE - (ICON_PADDING * 2);
            const {
                textureKey: iconTextureKey,
                scale: iconScale
            } = selectTextureAndScale(scene, buffDef.texture, iconSize);
            const icon = scene.add.image(0, 0, iconTextureKey).setScale(iconScale).setOrigin(0.5);
            buffElementContainer.add(icon);

            buffElementContainer.setSize(ICON_BG_SIZE, ICON_BG_SIZE);
            buffElementContainer.setInteractive({useHandCursor: true});

            buffElementContainer.on('pointerover', (ptr) => {
                const tooltipData = {name: buffDef.name || buffId};
                const descriptionLines = [];
                if (buffDef.effects && buffDef.effects.unlockedStage !== undefined) {
                    descriptionLines.push(`Unlocks Stage: ${buffDef.effects.unlockedStage}`);
                }
                if (descriptionLines.length > 0) {
                    tooltipData.description = descriptionLines.join('\n');
                }
                if (activeBuff.expiresAt) {
                    tooltipData.countdown = activeBuff.expiresAt;
                }
                const worldPos = buffElementContainer.getWorldTransformMatrix();
                scene.tooltip.show(worldPos.tx, worldPos.ty - ICON_BG_SIZE, tooltipData);
            });

            buffElementContainer.on('pointerout', () => {
                scene.tooltip.hide();
            });

            container.add(buffElementContainer);

            currentX += ICON_BG_SIZE + ICON_SPACING;
        });
    };

    const buffsUpdateHandler = () => updateBuffsDisplay();
    scene.events.on('buffs-updated', buffsUpdateHandler);

    scene.events.once('destroy', () => {
        scene.events.off('buffs-updated', buffsUpdateHandler);
    });

    updateBuffsDisplay();
    return container;
}