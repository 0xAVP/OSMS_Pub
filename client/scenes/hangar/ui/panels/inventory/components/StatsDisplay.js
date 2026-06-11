import Phaser from 'phaser';
import {drawParameters, drawBuffInfo, BONUS_LABELS, formatBonusValue} from './statsFormatters.js';
import {getCatalogData} from "../../../../wallet/catalog";
import {RARITY_COLORS} from "../../../../constants";
import {SHIP_LORE_DATA} from '../../mint/components/shipsData.js';

const STYLES = {
    title: {fontFamily: 'Tektur', fontSize: '20px', fontStyle: 'bold'},
    baseInfo: {fontFamily: 'Tektur', fontSize: '14px', color: '#cccccc'},
    uid: {fontFamily: 'Tektur', fontSize: '12px', color: '#a0a0a0'},
    sectionHeader: {fontFamily: 'Tektur', fontSize: '16px', color: '#e0e0e0', fontStyle: 'bold'},
    description: {fontFamily: 'Tektur', fontSize: '14px', color: '#a0a0a0', fontStyle: 'italic'},
    paramLabel: {fontFamily: 'Tektur', fontSize: '16px', color: '#cccccc'},
    paramValue: {fontFamily: 'Tektur', fontSize: '16px'},
    moduleText: {fontFamily: 'Tektur', fontSize: '16px'},
};

const LAYOUT = {
    TITLE_TO_BASE_INFO_GAP: 5,
    SECTION_SPACING: 20,
    HEADER_TO_CONTENT_GAP: 15,
    TOP_OFFSET: 20,
};

export class StatsDisplay extends Phaser.GameObjects.Container {
    constructor(scene, width) {
        super(scene, 0, 0);
        this.contentWidth = width;
        this.itemData = null;
        this.paramViewMode = 'current';
        this.rarityColorString = '#ffffff';
    }

    update(itemData, rarityColorString) {
        this.itemData = itemData;
        this.rarityColorString = rarityColorString;
        this.paramViewMode = 'current';
        return this._redraw();
    }

    _redraw() {
        this.removeAll(true);
        if (!this.itemData) return 0;

        let currentY = LAYOUT.TOP_OFFSET;

        let descriptionText = this.itemData.description;
        const shipLore = SHIP_LORE_DATA[this.itemData.type];
        if (shipLore) {
            descriptionText = shipLore.description;
        }

        const displayName = this.itemData.name || this.itemData.type || 'Unknown Item';
        const title = this.scene.add.text(this.contentWidth / 2, currentY, displayName, {
            ...STYLES.title,
            color: this.rarityColorString
        }).setOrigin(0.5);
        this.add(title);
        currentY += title.height + LAYOUT.TITLE_TO_BASE_INFO_GAP;

        const infoParts = [];

        const isPilot = this.itemData.category === 'pilots';
        const isShip = this.itemData.shipId !== undefined || this.itemData.category === 'ships';

        if (isPilot || isShip) {
            infoParts.push('NFT');
        }

        if (this.itemData.rarity) {
            infoParts.push(`Rarity: ${this.itemData.rarity}`);
        }
        if (this.itemData.hull !== undefined) {
            infoParts.push(`Hull: ${this.itemData.hull.toLocaleString()}`);
        } else if (this.itemData.level !== undefined) {
            infoParts.push(`Level: ${this.itemData.level}`);
        }
        if (this.itemData.quantity !== undefined && this.itemData.category !== 'modules' && this.itemData.category !== 'pilots' && !this.itemData.shipId) {
            infoParts.push(`Quantity: ${this.itemData.quantity}`);
        }

        if (infoParts.length > 0) {
            const baseInfoText = infoParts.join(' | ');
            const baseInfo = this.scene.add.text(this.contentWidth / 2, currentY, baseInfoText, STYLES.baseInfo).setOrigin(0.5);
            this.add(baseInfo);
            currentY += baseInfo.height;
        }

        currentY += LAYOUT.SECTION_SPACING;

        const divider = this.scene.add.graphics({y: currentY});
        divider.lineStyle(1, 0x41C6FF, 0.3).lineBetween(0, 0, this.contentWidth, 0);
        this.add(divider);
        currentY += LAYOUT.SECTION_SPACING;

        if (descriptionText) {
            const description = this.scene.add.text(0, currentY, descriptionText, {
                ...STYLES.description,
                wordWrap: {width: this.contentWidth}
            });
            this.add(description);
            currentY += description.height + LAYOUT.SECTION_SPACING;
        }

        if (this.itemData.category === 'pilots' && this.itemData.attributes) {
            const attributesHeader = this.scene.add.text(0, currentY, 'Echo Traits', STYLES.sectionHeader);
            this.add(attributesHeader);
            currentY += attributesHeader.height + LAYOUT.HEADER_TO_CONTENT_GAP;

            this.itemData.attributes.forEach(attr => {
                const labelText = this.scene.add.text(10, currentY, `${attr.trait_type}:`, STYLES.paramLabel);
                let valueColor = '#e0e0e0';
                if (attr.trait_type.toLowerCase() === 'rarity') {
                    const rColor = RARITY_COLORS[attr.value.toLowerCase()] || RARITY_COLORS.default;
                    valueColor = `#${rColor.toString(16).padStart(6, '0')}`;
                }
                const valueText = this.scene.add.text(
                    this.contentWidth - 10,
                    currentY,
                    attr.value.toString(),
                    {...STYLES.paramValue, color: valueColor}
                ).setOrigin(1, 0);

                this.add([labelText, valueText]);
                currentY += labelText.height + 8;
            });
            currentY += LAYOUT.SECTION_SPACING;
        }

        if (this.itemData.hull !== undefined && this.itemData.bonuses) {

            const bonuses = this.itemData.bonuses || {};
            const bonusKeys = Object.keys(bonuses);

            if (bonusKeys.length > 0) {
                const bonusesHeader = this.scene.add.text(0, currentY, 'Inherent Bonuses', STYLES.sectionHeader);
                this.add(bonusesHeader);
                currentY += bonusesHeader.height + LAYOUT.HEADER_TO_CONTENT_GAP;

                bonusKeys.forEach(key => {
                    const label = BONUS_LABELS[key] || key;
                    const value = bonuses[key];
                    const bonusLabel = this.scene.add.text(10, currentY, `${label}:`, STYLES.paramLabel);
                    const bonusValue = this.scene.add.text(this.contentWidth - 10, currentY, formatBonusValue(value), {
                        ...STYLES.paramValue,
                        color: '#42DA9D'
                    }).setOrigin(1, 0);

                    this.add([bonusLabel, bonusValue]);
                    currentY += bonusLabel.height + 8;
                });
            }
            currentY += LAYOUT.SECTION_SPACING;

            const modulesHeader = this.scene.add.text(0, currentY, 'Modules Installed', STYLES.sectionHeader);
            this.add(modulesHeader);
            currentY += modulesHeader.height + LAYOUT.HEADER_TO_CONTENT_GAP;

            const getModuleListForDisplay = (shipModules) => {
                const results = [];
                const slotOrder = [
                    {key: 'weapon1', name: 'Weapon 1'},
                    {key: 'weapon2', name: 'Weapon 2'},
                    {key: 'shield', name: 'Shield'},
                    {key: 'armor', name: 'Armor'},
                    {key: 'engine', name: 'Engine'},
                    {key: 'extra1', name: 'Extra 1'},
                    {key: 'extra2', name: 'Extra 2'},
                ];

                slotOrder.forEach(slotInfo => {
                    let moduleData = null;
                    switch (slotInfo.key) {
                        case 'weapon1':
                            moduleData = shipModules.weapons?.weapon1?.module;
                            break;
                        case 'weapon2':
                            moduleData = shipModules.weapons?.weapon2?.module;
                            break;
                        case 'extra1':
                            moduleData = shipModules.extra?.extra1?.module;
                            break;
                        case 'extra2':
                            moduleData = shipModules.extra?.extra2?.module;
                            break;
                        default:
                            moduleData = shipModules[slotInfo.key]?.module;
                    }

                    if (moduleData && moduleData.key) {
                        const catalogData = getCatalogData(this.scene, moduleData.key, 'modules');
                        results.push({
                            label: slotInfo.name,
                            value: `${catalogData.name} [${moduleData.level}]`,
                            rarity: catalogData.rarity
                        });
                    } else {
                        results.push({
                            label: slotInfo.name,
                            value: 'Empty',
                            rarity: 'default'
                        });
                    }
                });
                return results;
            };

            const moduleList = getModuleListForDisplay(this.itemData.modules);
            moduleList.forEach(moduleInfo => {
                const moduleLabel = this.scene.add.text(10, currentY, `${moduleInfo.label}:`, STYLES.paramLabel);
                const rarityColor = RARITY_COLORS[moduleInfo.rarity?.toLowerCase()] || RARITY_COLORS.default;
                const colorString = `#${rarityColor.toString(16).padStart(6, '0')}`;
                const moduleValue = this.scene.add.text(this.contentWidth - 10, currentY, moduleInfo.value, {
                    ...STYLES.paramValue,
                    color: colorString
                }).setOrigin(1, 0);

                this.add([moduleLabel, moduleValue]);
                currentY += moduleLabel.height + 8;
            });
        }

        const hasParams = (this.itemData.category === 'modules');
        if (hasParams) {
            const paramsResult = drawParameters(this, this.itemData, currentY, this.paramViewMode);
            currentY += paramsResult.height;

            if (paramsResult.toggleButton) {
                paramsResult.toggleButton.on('toggle', (newState) => {
                    this.paramViewMode = newState;
                    this._redraw();
                });
            }
            currentY += LAYOUT.SECTION_SPACING;
        }

        if (this.itemData.activatesBuff) {
            const buffHeader = this.scene.add.text(0, currentY, 'Bonus Effect', STYLES.sectionHeader);
            this.add(buffHeader);
            currentY += buffHeader.height + LAYOUT.HEADER_TO_CONTENT_GAP;
            currentY += drawBuffInfo(this, this.itemData, currentY);
            currentY += LAYOUT.SECTION_SPACING;
        }

        return currentY;
    }
}
