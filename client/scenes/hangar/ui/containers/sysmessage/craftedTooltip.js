import {selectTextureAndScale} from '../../../../core/utils.js';
import {RARITY_COLORS} from '../../../constants.js';

const CONFIG = {
    WIDTH: 400,
    CORNER_RADIUS: {tl: 10, tr: 10, bl: 10, br: 10},
    PADDING: 20,
    OFFSET_Y: 10,
    IMG_WIDTH: 80,
    IMG_HEIGHT: 80,
    IMG_X: -140,
    TEXT_X: 140,
    TEXT_WIDTH: 200,
    TEXT_SPACING: 8,
    SECTION_SPACING: 15,
    BG_COLOR: 0x2c2f38,
    BG_ALPHA: 1,
    MIN_HEIGHT: 100,
};

export function craftedTooltipHandler(scene, sysMessageContainer, containerHeight) {

    const mainContainer = scene.add.container(0, 0).setDepth(1001).setVisible(false);

    const background = scene.add.graphics();
    mainContainer.add(background);

    const contentContainer = scene.add.container(0, 0);
    mainContainer.add(contentContainer);

    const itemBg = scene.add.image(CONFIG.IMG_X, 0, 'card_item')
        .setDisplaySize(CONFIG.IMG_WIDTH, CONFIG.IMG_HEIGHT).setOrigin(0.5, 0).setDepth(1);
    contentContainer.add(itemBg);

    const itemImage = scene.add.image(CONFIG.IMG_X, 0, 'card_item')
        .setDisplaySize(CONFIG.IMG_WIDTH * 0.8, CONFIG.IMG_HEIGHT * 0.8).setOrigin(0.5, 0).setDepth(2);
    contentContainer.add(itemImage);

    const nameText = scene.add.text(CONFIG.TEXT_X - CONFIG.WIDTH / 2, 0, '', {
        fontFamily: 'Tektur', fontSize: '16px', fontStyle: 'bold', color: '#e0e0e0',
        wordWrap: {width: CONFIG.TEXT_WIDTH}, lineSpacing: 4,
    }).setOrigin(0, 0).setDepth(1);
    contentContainer.add(nameText);

    const rarityLine = scene.add.graphics().setDepth(1);
    contentContainer.add(rarityLine);

    const levelText = scene.add.rexBBCodeText(CONFIG.TEXT_X - CONFIG.WIDTH / 2, 0, '', {
        fontFamily: 'Tektur', fontSize: '14px', color: '#e0e0e0',
        wordWrap: {width: CONFIG.TEXT_WIDTH}, lineSpacing: 4,
    }).setOrigin(0, 0).setDepth(1);
    contentContainer.add(levelText);

    const typeText = scene.add.text(CONFIG.TEXT_X - CONFIG.WIDTH / 2, 0, '', {
        fontFamily: 'Tektur', fontSize: '14px', color: '#e0e0e0',
        wordWrap: {width: CONFIG.TEXT_WIDTH}, lineSpacing: 4,
    }).setOrigin(0, 0).setDepth(1);
    contentContainer.add(typeText);

    const extraText = scene.add.text(CONFIG.TEXT_X - CONFIG.WIDTH / 2, 0, '', {
        fontFamily: 'Tektur', fontSize: '14px', color: '#cccccc',
        wordWrap: {width: CONFIG.TEXT_WIDTH}, lineSpacing: 4,
    }).setOrigin(0, 0).setDepth(1);
    contentContainer.add(extraText);

    const update = (itemData) => {

        if (!itemData || (!itemData.key && !itemData.craftedModules)) {
            itemBg.setVisible(false);
            itemImage.setVisible(false);
            return false;
        }
        nameText.setText('');
        levelText.setText('');
        typeText.setText('');
        rarityLine.clear();
        extraText.setText('');

        const {
            textureKey: bgTexture,
            scale: bgScale
        } = selectTextureAndScale(scene, 'factory_line_item_bg', CONFIG.IMG_WIDTH);
        itemBg.setTexture(bgTexture).setScale(bgScale).setDisplaySize(CONFIG.IMG_WIDTH, CONFIG.IMG_HEIGHT).setVisible(true);
        const textureKey = itemData.key || 'factory_line_item_bg';
        const {textureKey: selectedTexture, scale} = selectTextureAndScale(scene, textureKey, CONFIG.IMG_WIDTH * 0.8);
        itemImage.setTexture(selectedTexture).setScale(scale).setDisplaySize(CONFIG.IMG_WIDTH * 0.8, CONFIG.IMG_HEIGHT * 0.8).setVisible(true);
        let rarityColor = RARITY_COLORS.common;
        switch (itemData.category) { /* ... (ваш switch/case без изменений) ... */
            case 'components':
                nameText.setText(itemData.name);
                levelText.setText(`Quantity: ${itemData.quantity || 1}`);
                typeText.setText(`Category: ${itemData.category || 'Unknown'}`);
                extraText.setText(itemData.description || '');
                break;
            case 'modules':
                if (itemData.craftedModules?.length) {
                    const module = itemData.craftedModules[0];
                    nameText.setText(itemData.name);
                    levelText.setText(`Level: ${module.level || 1}, ${itemData.rarity || 'Unknown'}`);
                    typeText.setText(`Type: ${itemData.type || 'Unknown'}`);
                    extraText.setText(formatModuleStats(itemData.type, module.params));
                    rarityColor = RARITY_COLORS[module.rarity?.toLowerCase()] || RARITY_COLORS.common;
                } else {
                    console.warn('No craftedModules for module category:', itemData);
                    itemBg.setVisible(false);
                    itemImage.setVisible(false);
                    return false;
                }
                break;
            default:
                console.warn('Unknown crafted item format:', itemData);
                itemBg.setVisible(false);
                itemImage.setVisible(false);
                return false;
        }

        itemBg.setY(0);
        itemImage.setY((CONFIG.IMG_HEIGHT - (CONFIG.IMG_HEIGHT * 0.8)) / 2);

        let currentY = 0;
        nameText.setY(currentY);
        currentY += nameText.height;
        const lineY = currentY + 4;
        rarityLine.lineStyle(2, rarityColor, 1)
            .moveTo(CONFIG.TEXT_X - CONFIG.WIDTH / 2, lineY)
            .lineTo(CONFIG.TEXT_X - CONFIG.WIDTH / 2 + CONFIG.TEXT_WIDTH, lineY)
            .strokePath();
        currentY = lineY + 6;
        levelText.setY(currentY);
        currentY += levelText.height + CONFIG.TEXT_SPACING;
        typeText.setY(currentY);
        currentY += typeText.height + CONFIG.SECTION_SPACING;
        extraText.setY(currentY);

        const bounds = contentContainer.getBounds();
        const contentHeight = bounds.height;

        const totalHeight = Math.max(contentHeight + CONFIG.PADDING * 2, CONFIG.MIN_HEIGHT);

        background.clear()
            .fillStyle(CONFIG.BG_COLOR, CONFIG.BG_ALPHA)
            .fillRoundedRect(-CONFIG.WIDTH / 2, 0, CONFIG.WIDTH, totalHeight, CONFIG.CORNER_RADIUS);

        contentContainer.setY((totalHeight - contentHeight) / 2);

        mainContainer.setPosition(
            sysMessageContainer.x,
            sysMessageContainer.y + containerHeight / 2 + CONFIG.OFFSET_Y
        );

        return true;
    };

    function formatModuleStats(type, params) {
        const stats = [];

        switch (type) {
            case 'weapon':
                if (params.damage) {
                    stats.push(`Damage: ${params.damage.min.toFixed(2)} - ${params.damage.max.toFixed(2)}`);
                }
                if (params.fireRate) {
                    stats.push(`Fire Rate: ${params.fireRate}`);
                }
                if (params.energyCost) {
                    stats.push(`Energy Cost: ${params.energyCost.toFixed(2)}`);
                }
                if (params.critical) {
                    stats.push(`Critical: ${(params.critical.chance || 0).toFixed(2)}% (${params.critical.modifier || 0}%)`);
                }
                if (params.bullet) {
                    stats.push(`Bullet Speed: ${params.bullet.speed || 0}`);
                }
                break;

            case 'shield':
                if (params.shield) {
                    stats.push(`Shield Capacity: ${params.shield.capacity}`);
                    stats.push(`Shield Regen: ${params.shield.regen}`);
                }
                break;

            case 'armor':
                if (params.armor) {
                    stats.push(`Armor Capacity: ${params.armor.capacity}`);
                }
                if (params.absorption) {
                    stats.push(`Absorption: ${params.absorption.chance}% (${params.absorption.absorb})`);
                }
                break;

            case 'engine':
                if (params.speed) {
                    stats.push(`Speed: ${params.speed}`);
                }
                if (params.energy) {
                    stats.push(`Energy Capacity: ${params.energy.capacity}`);
                    stats.push(`Energy Regen: ${params.energy.regen}`);
                }
                if (params.evasion) {
                    stats.push(`Evasion: ${params.evasion}%`);
                }
                break;

            default:
                stats.push('No parameters available');
                console.warn(`Unknown module type: ${params.type}`, params);
                break;
        }

        return stats.join('\n').trim();
    }

    return {container: mainContainer, update};
}