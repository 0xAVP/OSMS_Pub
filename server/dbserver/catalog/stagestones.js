/**
 * @file Единственный источник правды о предметах Stagestone.
 * Содержит и шаблон, и логику для генерации.
 */


const ITEM_TEMPLATE = {
    key_prefix: "stagestone_tier_",
    name_template: "Stagestone Tier {tier}",
    description_template: "An ancient conduit pulsing with energy. Use it to open a temporary Time Portal to Stage {stage}.",
    category: "stagestones",
    attributes: {
        "isUsable": true,
        "isTradable": true,
    },
    textureKey: "stagestone_texture",
    activatesBuff: "timePortal_buff_tier_{tier}"
};

function isStagestone(itemKey) {
    if (typeof itemKey !== 'string') return false;
    return itemKey.startsWith(ITEM_TEMPLATE.key_prefix);
}

function getStagestoneData(itemKey) {
    if (!isStagestone(itemKey)) return null;

    const tierString = itemKey.replace(ITEM_TEMPLATE.key_prefix, '');
    const tier = parseInt(tierString, 10);
    if (isNaN(tier) || tier <= 0) return null;

    const unlockedStage = (tier - 1) * 5 + 5;

    return {
        key: itemKey,
        name: ITEM_TEMPLATE.name_template.replace('{tier}', tier),
        description: ITEM_TEMPLATE.description_template.replace('{stage}', unlockedStage),
        category: ITEM_TEMPLATE.category,
        attributes: ITEM_TEMPLATE.attributes,
        textureKey: ITEM_TEMPLATE.textureKey,
        activatesBuff: ITEM_TEMPLATE.activatesBuff.replace('{tier}', tier)
    };
}

function getStagestoneItemTemplate() {
    return ITEM_TEMPLATE;
}

module.exports = {
    isStagestone,
    getStagestoneData,
    getStagestoneItemTemplate,
};