import {ListItem} from '../../../components/ListItem.js';
import {FilterableListPanel} from '../../../components/FilterableListPanel.js';

const GAP = 20;
const SORTER_WIDTH = 50;
const SCROLLBAR_WIDTH = 10;

/**
 * Создает контент для вкладки "Blueprints".
 * @param {object} config - Конфигурация.
 * @param {Phaser.Scene} config.scene - Сцена.
 * @param {number} config.availableHeight - Доступная высота.
 * @param {number} config.totalWidth - Общая доступная ширина для вкладки.
 * @param {function(string):void} config.onSortChange - Колбэк при смене фильтра.
 * @param {function(object):void} config.onItemSelected - Колбэк при выборе элемента.
 */
export function createBlueprintsTab(config) {
    const {scene, availableHeight, totalWidth, onSortChange, onItemSelected} = config;

    const sortButtons = [
        {id: 'all'},
        {id: 'modules'},
        {id: 'components'},
        {id: 'hulls'},
        {id: 'other'}
    ];

    const listComponentWidth = totalWidth - SORTER_WIDTH - GAP;
    const listContentWidth = listComponentWidth - SCROLLBAR_WIDTH - GAP;

    /**
     * Фабрика для создания элементов списка чертежей.
     * @param {object} blueprintData - Данные чертежа.
     * @param {string | null} selectedKey - Ключ текущего выбранного чертежа.
     */
    const blueprintItemFactory = (blueprintData, selectedKey) => {
        const itemCraftedKey = Object.keys(blueprintData.itemCrafted || {})[0];

        const listItem = new ListItem(scene, {
            width: listContentWidth,
            height: 70,
            rarity: blueprintData.rarity,
            iconKey: itemCraftedKey,
            label: blueprintData.name
        });

        if (blueprintData.key === selectedKey) {
            listItem.setState('selected');
        }

        listItem.on('pointerover', () => {
            if (blueprintData.key !== selectedKey) listItem.setState('hover');
        });
        listItem.on('pointerout', () => {
            if (blueprintData.key !== selectedKey) listItem.setState('idle');
        });
        listItem.on('pointerdown', () => {
            if (onItemSelected) onItemSelected(blueprintData);
        });

        return listItem;
    };

    const panel = new FilterableListPanel({
        scene,
        availableHeight,
        totalWidth,
        sortButtons,
        itemFactory: blueprintItemFactory,
        onSortChange,
        sorterPosition: 'right',
        scrollbarPosition: 'left'
    });

    return {
        container: panel,
        update: (blueprints, selectedKey) => panel.update(blueprints, selectedKey),
    };
}
