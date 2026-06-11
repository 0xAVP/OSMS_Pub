import {ListItem} from '../../../components/ListItem.js';
import {FilterableListPanel} from '../../../components/FilterableListPanel.js';

const GAP = 20;
const SORTER_WIDTH = 50;
const SCROLLBAR_WIDTH = 10;

/**
 * Создает контент для вкладки "Upgrade".
 * @param {object} config - Конфигурация.
 * @param {Phaser.Scene} config.scene - Сцена.
 * @param {number} config.availableHeight - Доступная высота.
 * @param {number} config.totalWidth - Общая доступная ширина для вкладки.
 * @param {function(string):void} config.onSortChange - Колбэк при смене фильтра.
 * @param {function(object):void} config.onItemSelected - Колбэк при выборе элемента.
 */
export function createUpgradeTabContent(config) {
    const {scene, availableHeight, totalWidth, onSortChange, onItemSelected} = config;

    const sortButtons = [
        {id: 'all'}, {id: 'weapon'}, {id: 'shield'},
        {id: 'armor'}, {id: 'engine'}, {id: 'extra'},
    ];

    const listComponentWidth = totalWidth - SORTER_WIDTH - GAP;
    const listContentWidth = listComponentWidth - SCROLLBAR_WIDTH - GAP;

    /**
     * Фабрика для создания элементов списка модулей.
     */
    const moduleItemFactory = (itemData, selectedUID) => {
        const displayName = itemData.name || itemData.key || 'Unknown Module';
        const displayLevel = itemData.level !== undefined ? itemData.level : 'N/A';

        const listItem = new ListItem(scene, {
            width: listContentWidth,
            height: 70,
            rarity: itemData.rarity,
            iconKey: itemData.key,
            label: `${displayName} (Lvl ${displayLevel})`,
        });

        if (itemData.uid === selectedUID) {
            listItem.setState('selected');
        }

        listItem.on('pointerover', () => {
            if (itemData.uid !== selectedUID) listItem.setState('hover');
        });
        listItem.on('pointerout', () => {
            if (itemData.uid !== selectedUID) listItem.setState('idle');
        });
        listItem.on('pointerdown', () => {
            if (onItemSelected) onItemSelected(itemData);
        });

        return listItem;
    };

    const panel = new FilterableListPanel({
        scene,
        availableHeight,
        totalWidth,
        sortButtons,
        itemFactory: moduleItemFactory,
        onSortChange,
        sorterPosition: 'right',
        scrollbarPosition: 'left'
    });

    return {
        container: panel,
        update: (modules, selectedUID) => panel.update(modules, selectedUID),
    };
}
