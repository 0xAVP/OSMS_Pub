import {SortController} from '../../../components/SortController.js';
import {ScrollableGrid} from '../../../components/ScrollableGrid.js';
import {GridItem} from '../../../components/GridItem.js';

const GAP = 20;
const SORTER_WIDTH = 50;
const SCROLLBAR_WIDTH = 10;
const COLUMNS = 4;
const CELL_HORIZONTAL_GAP = 15;
const CELL_VERTICAL_GAP = 15;

export function createItemsTab(config) {
    const {scene, totalWidth, availableHeight, onSortChange, onItemSelected} = config;
    const container = scene.add.container(0, 0);

    const gridComponentWidth = totalWidth - SORTER_WIDTH - GAP;

    const gridContentWidth = gridComponentWidth - SCROLLBAR_WIDTH - GAP;

    const cellWidth = Math.floor((gridContentWidth - (COLUMNS - 1) * CELL_HORIZONTAL_GAP) / COLUMNS);

    const sortController = new SortController(scene, {
        buttonWidth: SORTER_WIDTH,
        buttons: [
            {id: 'all'},
            {id: 'modules'},
            {id: 'resources'},
            {id: 'components'},
            {id: 'blueprints'},
            {id: 'stagestones'},
            {id: 'hulls'},
            {id: 'other'}
        ]
    });

    const grid = new ScrollableGrid(scene, {
        width: gridComponentWidth, height: availableHeight,
        columns: COLUMNS, cellWidth: cellWidth, cellHeight: 120,
        gap: CELL_VERTICAL_GAP,
        scrollbarPosition: 'left'
    });

    grid.setPosition(0, 0);
    sortController.setPosition(gridComponentWidth + GAP + (SORTER_WIDTH / 2), 0);
    container.add([grid, sortController]);

    const itemCellFactory = (item, selectedUID) => {
        const isModule = item.category === 'modules';
        const isStagestone = item.category === 'stagestones';
        let labelText = `${item.quantity}`;
        if (isModule) {
            labelText = `Lvl: ${item.level}`;
        }

        const cellConfig = {
            width: cellWidth, height: 120,
            iconKey: item.key, labelText: labelText, rarity: item.rarity,
            tooltipData: {name: item.name}
        };

        if (isStagestone) {
            const tierMatch = item.key.match(/_(\d+)$/);
            if (tierMatch && tierMatch[1]) {
                cellConfig.tier = tierMatch[1];
            }
        }

        const cell = new GridItem(scene, cellConfig);
        const itemIdentifier = item.uid || item.key;

        if (itemIdentifier === selectedUID) cell.setState('selected');
        cell.on('pointerover', () => {
            if (itemIdentifier !== selectedUID) cell.setState('hover');
        });
        cell.on('pointerout', () => {
            if (itemIdentifier !== selectedUID) cell.setState('idle');
        });
        cell.on('pointerdown', () => {
            if (onItemSelected) onItemSelected(item);
        });

        return cell;
    };

    const populate = (items, selectedUID) => {
        grid.populate(items, (itemData) => itemCellFactory(itemData, selectedUID));
    };

    sortController.on('sort-selected', onSortChange);

    container.resize = (newHeight) => {
        if (grid && typeof grid.resize === 'function') {
            grid.resize(newHeight);
        }
    };

    return {container, update: populate};
}
