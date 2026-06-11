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

export function upgradeTooltipHandler(scene, sysMessageContainer, containerHeight) {

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

    const extraText = scene.add.rexBBCodeText(CONFIG.TEXT_X - CONFIG.WIDTH / 2, 0, '', {
        fontFamily: 'Tektur', fontSize: '14px', color: '#cccccc',
        wordWrap: {width: CONFIG.TEXT_WIDTH}, lineSpacing: 4,
    }).setOrigin(0, 0).setDepth(1);
    contentContainer.add(extraText);

    const update = (itemData) => {
        if (!itemData || !itemData.new || !itemData.new.key || itemData.new.category !== 'modules') {
            console.warn('Invalid itemData for upgrade tooltip:', itemData);
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

        const textureKey = itemData.new.key || 'factory_line_item_bg';
        const {textureKey: selectedTexture, scale} = selectTextureAndScale(scene, textureKey, CONFIG.IMG_WIDTH * 0.8);
        itemImage.setTexture(selectedTexture).setScale(scale).setDisplaySize(CONFIG.IMG_WIDTH * 0.8, CONFIG.IMG_HEIGHT * 0.8).setVisible(true);

        nameText.setText(itemData.new.name || 'Unknown Module');
        const oldLevel = itemData.old?.level || 1;
        const newLevel = itemData.new.level || 1;
        levelText.setText(`Level: ${oldLevel} [color=#00ff00]-> ${newLevel}[/color], ${itemData.new.rarity || 'Unknown'}`);
        typeText.setText(`Type: ${itemData.new.type || 'Unknown'}`);
        const rarityColor = RARITY_COLORS[itemData.new.rarity?.toLowerCase()] || RARITY_COLORS.common;
        extraText.setText(formatModuleStats(itemData.new.type, itemData.new.params, itemData.old?.params));

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

    function formatModuleStats(type, newParams, oldParams) {
        const stats = [];

        switch (type) {
            case 'weapon':
                if (newParams.damage) {
                    const oldDamage = oldParams?.damage || {min: 0, max: 0};
                    const minDamageText = newParams.damage.min > oldDamage.min
                        ? `[color=#00ff00]${newParams.damage.min.toFixed(2)}[/color]`
                        : newParams.damage.min.toFixed(2);
                    const maxDamageText = newParams.damage.max > oldDamage.max
                        ? `[color=#00ff00]${newParams.damage.max.toFixed(2)}[/color]`
                        : newParams.damage.max.toFixed(2);
                    stats.push(`Damage: ${oldDamage.min.toFixed(2)} - ${oldDamage.max.toFixed(2)} -> ${minDamageText} - ${maxDamageText}`);
                }
                if (newParams.fireRate) {
                    const oldFireRate = oldParams?.fireRate || 0;
                    const fireRateText = newParams.fireRate > oldFireRate
                        ? `[color=#00ff00]${newParams.fireRate}[/color]`
                        : newParams.fireRate;
                    stats.push(`Fire Rate: ${oldFireRate} -> ${fireRateText}`);
                }
                if (newParams.energyCost) {
                    const oldEnergyCost = oldParams?.energyCost || 0;
                    const energyCostText = newParams.energyCost < oldEnergyCost
                        ? `[color=#00ff00]${newParams.energyCost.toFixed(2)}[/color]`
                        : newParams.energyCost > oldEnergyCost
                            ? `[color=#ff0000]${newParams.energyCost.toFixed(2)}[/color]`
                            : newParams.energyCost.toFixed(2);
                    stats.push(`Energy Cost: ${oldEnergyCost.toFixed(2)} -> ${energyCostText}`);
                }
                if (newParams.critical) {
                    const oldCritical = oldParams?.critical || {chance: 0, modifier: 0};
                    const chanceText = newParams.critical.chance > oldCritical.chance
                        ? `[color=#00ff00]${newParams.critical.chance.toFixed(2)}[/color]`
                        : newParams.critical.chance.toFixed(2);
                    const modifierText = newParams.critical.modifier > oldCritical.modifier
                        ? `[color=#00ff00]${newParams.critical.modifier}[/color]`
                        : newParams.critical.modifier;
                    stats.push(`Critical: ${oldCritical.chance.toFixed(2)}% (${oldCritical.modifier}%) -> ${chanceText}% (${modifierText}%)`);
                }
                if (newParams.bullet) {
                    const oldBulletSpeed = oldParams?.bullet?.speed || 0;
                    const bulletSpeedText = newParams.bullet.speed > oldBulletSpeed
                        ? `[color=#00ff00]${newParams.bullet.speed}[/color]`
                        : newParams.bullet.speed;
                    stats.push(`Bullet Speed: ${oldBulletSpeed} -> ${bulletSpeedText}`);
                }
                break;

            case 'shield':
                if (newParams.shield) {
                    const oldShield = oldParams?.shield || {capacity: 0, regen: 0};
                    const capacityText = newParams.shield.capacity > oldShield.capacity
                        ? `[color=#00ff00]${newParams.shield.capacity}[/color]`
                        : newParams.shield.capacity;
                    const regenText = newParams.shield.regen > oldShield.regen
                        ? `[color=#00ff00]${newParams.shield.regen}[/color]`
                        : newParams.shield.regen;
                    stats.push(`Shield Capacity: ${oldShield.capacity} -> ${capacityText}`);
                    stats.push(`Shield Regen: ${oldShield.regen} -> ${regenText}`);
                }
                break;

            case 'armor':
                if (newParams.armor) {
                    const oldArmor = oldParams?.armor || {capacity: 0};
                    const capacityText = newParams.armor.capacity > oldArmor.capacity
                        ? `[color=#00ff00]${newParams.armor.capacity}[/color]`
                        : newParams.armor.capacity;
                    stats.push(`Armor Capacity: ${oldArmor.capacity} -> ${capacityText}`);
                }
                if (newParams.absorption) {
                    const oldAbsorption = oldParams?.absorption || {chance: 0, absorb: 0};
                    const chanceText = newParams.absorption.chance > oldAbsorption.chance
                        ? `[color=#00ff00]${newParams.absorption.chance}[/color]`
                        : newParams.absorption.chance;
                    const absorbText = newParams.absorption.absorb > oldAbsorption.absorb
                        ? `[color=#00ff00]${newParams.absorption.absorb}[/color]`
                        : newParams.absorption.absorb;
                    stats.push(`Absorption: ${oldAbsorption.chance}% (${oldAbsorption.absorb}) -> ${chanceText}% (${absorbText})`);
                }
                break;

            case 'engine':
                if (newParams.speed) {
                    const oldSpeed = oldParams?.speed || 0;
                    const speedText = newParams.speed > oldSpeed
                        ? `[color=#00ff00]${newParams.speed}[/color]`
                        : newParams.speed;
                    stats.push(`Speed: ${oldSpeed} -> ${speedText}`);
                }
                if (newParams.energy) {
                    const oldEnergy = oldParams?.energy || {capacity: 0, regen: 0};
                    const capacityText = newParams.energy.capacity > oldEnergy.capacity
                        ? `[color=#00ff00]${newParams.energy.capacity}[/color]`
                        : newParams.energy.capacity;
                    const regenText = newParams.energy.regen > oldEnergy.regen
                        ? `[color=#00ff00]${newParams.energy.regen}[/color]`
                        : newParams.energy.regen;
                    stats.push(`Energy Capacity: ${oldEnergy.capacity} -> ${capacityText}`);
                    stats.push(`Energy Regen: ${oldEnergy.regen} -> ${regenText}`);
                }
                if (newParams.evasion) {
                    const oldEvasion = oldParams?.evasion || 0;
                    const evasionText = newParams.evasion > oldEvasion
                        ? `[color=#00ff00]${newParams.evasion}%[/color]`
                        : `${newParams.evasion}%`;
                    stats.push(`Evasion: ${oldEvasion}% -> ${evasionText}`);
                }
                break;

            default:
                stats.push('No parameters available');
                console.warn(`Unknown module type: ${type}`, newParams);
                break;
        }

        return stats.join('\n').trim();
    }

    return {container: mainContainer, update};
}