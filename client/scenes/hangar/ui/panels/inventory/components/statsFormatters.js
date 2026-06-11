import {paramLabelsByType} from '../../../../constants.js';
import {getBuffDefinition} from '../../../../../shared/BuffService.js';
import {ParamToggle} from './ParamToggle.js';

const STYLES = {
    paramLabel: {fontFamily: 'Tektur', fontSize: '16px', color: '#cccccc'},
    paramValue: {fontFamily: 'Tektur', fontSize: '16px'},
    buffName: {fontFamily: 'Tektur', fontSize: '14px', color: '#41C6FF'},
};

export const BONUS_LABELS = {
    damageBonusPercent: "Damage",
    critChanceBonusPercent: "Critical Chance",
    critDamageBonusPercent: "Critical Damage",
    shieldCapacityBonusPercent: "Shield Capacity",
    shieldRegenBonusPercent: "Shield Regen",
    shieldDelayStartRegenBonusPercent: "Shield Regen Delay",
    armorCapacityBonusPercent: "Armor Capacity",
    armorAbsorptionChanceBonusPercent: "Absorption Chance",
    armorAbsorptionAmountBonusPercent: "Absorption",
    evasionChanceBonusPercent: "Evasion Chance",
    hullAmountBonusPercent: "Hull",
    energyCapacityBonusPercent: "Energy Capacity",
    energyRegenBonusPercent: "Energy Regen",
};

export function formatBonusValue(value) {
    const sign = value > 0 ? '+' : '';
    const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);
    return `${sign}${formattedValue}%`;
}

function getParamValue(params, key) {
    if (!params) return undefined;
    const keys = key.split('.');
    let value = params;
    for (const k of keys) {
        if (value && typeof value === 'object' && value[k] !== undefined) {
            value = value[k];
        } else {
            return undefined;
        }
    }
    return value;
}

export function formatDisplayValue(value) {
    if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
        return `${value[0]} - ${value[1]}`;
    }
    if (typeof value === 'number' && !Number.isInteger(value)) {
        return value.toFixed(2);
    }
    if (value !== undefined && value !== null) {
        return value.toString();
    }
    return '';
}

export function drawParameters(targetContainer, itemData, startY, mode = 'current') {
    let currentY = startY;
    const scene = targetContainer.scene;
    const contentWidth = targetContainer.parentContainer.contentWidth;

    let paramsSource, initialParamsSource, type;
    const isBlueprint = itemData.category === 'blueprints';

    if (isBlueprint) {
        const craftedItemData = Object.values(itemData.itemCrafted || {})[0] || {};
        paramsSource = craftedItemData.craftParams;
        type = craftedItemData.type;
        initialParamsSource = craftedItemData.initialParams;
    } else {
        paramsSource = itemData.params;
        initialParamsSource = itemData.initialParams;
        type = itemData.type;
    }

    const displayParams = mode === 'basic' ? initialParamsSource : paramsSource;
    if (!displayParams || !type || !paramLabelsByType[type]) {
        return {height: 0, toggleButton: null};
    }

    const labels = paramLabelsByType[type];
    for (const key in labels) {
        const displayValue = getParamValue(displayParams, key);
        if (displayValue === undefined) continue;

        const label = scene.add.text(10, currentY, `${labels[key]}:`, STYLES.paramLabel);
        targetContainer.add(label);

        let valueColor = mode === 'basic' ? '#a0a0a0' : '#42DA9D';

        if (mode === 'current' && initialParamsSource) {
            const initialValue = getParamValue(initialParamsSource, key);
            const isLowerBetter = key.includes('energyCost');
            const numCurrent = parseFloat(Array.isArray(displayValue) ? displayValue[0] : displayValue);
            const numInitial = parseFloat(Array.isArray(initialValue) ? initialValue[0] : initialValue);

            if (!isNaN(numCurrent) && !isNaN(numInitial)) {
                if (numCurrent > numInitial) valueColor = isLowerBetter ? '#ff6b6b' : '#42DA9D';
                else if (numCurrent < numInitial) valueColor = isLowerBetter ? '#42DA9D' : '#ff6b6b';
                else valueColor = '#e0e0e0';
            }
        }

        const formattedText = formatDisplayValue(displayValue);
        const valueText = scene.add.text(contentWidth - 10, currentY, formattedText, {
            ...STYLES.paramValue,
            color: valueColor
        }).setOrigin(1, 0);
        targetContainer.add(valueText);

        currentY += label.height + 8;
    }

    let toggleButton = null;
    if (initialParamsSource) {
        currentY += 10;
        toggleButton = new ParamToggle(scene, contentWidth / 2, currentY, mode);
        targetContainer.add(toggleButton);
        currentY += toggleButton.height;
    }

    return {height: currentY - startY, toggleButton: toggleButton};
}

export function drawBuffInfo(targetContainer, itemData, startY) {
    if (!itemData.activatesBuff) return 0;

    const scene = targetContainer.scene;
    const buffDef = getBuffDefinition(scene, itemData.activatesBuff);
    if (!buffDef) return 0;

    const buffNameText = scene.add.text(10, startY, `Activates: `, {
        fontFamily: 'Tektur',
        fontSize: '14px',
        color: '#cccccc'
    });
    const buffValueText = scene.add.text(buffNameText.x + buffNameText.width, startY, buffDef.name, STYLES.buffName);

    targetContainer.add([buffNameText, buffValueText]);
    return buffNameText.height + 5;
}