import {ScrollableGrid} from '../../../components/ScrollableGrid.js';
import {SortController} from '../../../components/SortController.js';
import {GridItem} from '../../../components/GridItem.js';

const GAP = 20;
const SORTER_WIDTH = 50;
const SCROLLBAR_WIDTH = 10;
const COLUMNS = 4;
const CELL_HORIZONTAL_GAP = 15;
const CELL_VERTICAL_GAP = 15;

/**
 * Создает контент для вкладки "Ships".
 */
export function createShipsTab(config) {
    const {scene, totalWidth, availableHeight, onSortChange, onItemSelected} = config;
    const container = scene.add.container(0, 0);

    const gridComponentWidth = totalWidth - SORTER_WIDTH - GAP;
    const gridContentWidth = gridComponentWidth - SCROLLBAR_WIDTH - GAP;
    const cellWidth = Math.floor((gridContentWidth - (COLUMNS - 1) * CELL_HORIZONTAL_GAP) / COLUMNS);

    const sortController = new SortController(scene, {
        buttonWidth: SORTER_WIDTH,
        buttons: [{id: 'all'}]
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

    const shipCellFactory = (shipData, selectedUID) => {
        const cell = new GridItem(scene, {
            width: cellWidth, height: 120,
            iconKey: shipData.type,
            labelText: `#${shipData.shipId}`,
            rarity: shipData.rarity,
            tooltipData: {name: shipData.type}
        });

        if (shipData.shipId === selectedUID) cell.setState('selected');
        cell.on('pointerover', () => {
            if (shipData.shipId !== selectedUID) cell.setState('hover');
        });
        cell.on('pointerout', () => {
            if (shipData.shipId !== selectedUID) cell.setState('idle');
        });
        cell.on('pointerdown', () => {
            if (onItemSelected) onItemSelected(shipData);
        });

        return cell;
    };

    const populate = (ships, selectedUID) => {
        grid.populate(ships, (shipData) => shipCellFactory(shipData, selectedUID));
    };

    sortController.on('sort-selected', onSortChange);

    container.resize = (newHeight) => {
        if (grid && typeof grid.resize === 'function') {
            grid.resize(newHeight);
        }
    };

    return {container, update: populate};
}
