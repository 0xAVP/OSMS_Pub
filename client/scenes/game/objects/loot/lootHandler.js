import {selectTextureAndScale} from '../../../core/utils';
import LootIdManager from './lootIdManager';
import {addLootNotification} from '../../ui/floatingText';
import {DEPTHS} from "../../ui/depths";

export function handleLootDrop(scene, loot, x, y) {
    if (!loot || !Array.isArray(loot) || loot.length === 0) {
        return;
    }
    const targetHeight = 32;
    loot.forEach((item, index) => {
        const id = item[0];
        const amount = item[1];

        const itemData = LootIdManager.getItemData(id);
        if (!itemData) {
            console.warn(`Loot item with unknown ID ${id} received, cannot display.`);
            return;
        }

        addLootNotification(scene, itemData, amount);

        const baseTextureKey = itemData.key.startsWith('stagestone_tier_')
            ? 'stagestone_texture'
            : itemData.key;

        const {textureKey, scale} = selectTextureAndScale(scene, baseTextureKey, targetHeight);

        const lootSprite = scene.poolManager.spawn('loot', x, y);

        if (!lootSprite) {
            console.warn('Loot Pool Full');
            return;
        }
        lootSprite.setTexture(textureKey);
        lootSprite
            .setActive(true)
            .setVisible(true)
            .setAlpha(1)
            .setScale(scale)
            .setDepth(DEPTHS.LOOT)
            .setOrigin(0.5);

        scene.tweens.add({
            targets: lootSprite,
            x: 0,
            y: (scene.startHeight / 2) + index * 40,
            scale: scale * 1.2,
            alpha: 0,
            duration: 5000,
            ease: 'Power2',
            onComplete: () => {
                scene.poolManager.despawn('loot', lootSprite);
            }
        });
    });
}