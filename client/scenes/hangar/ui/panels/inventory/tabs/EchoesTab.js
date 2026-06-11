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
 * Создает контент для вкладки "Echoes".
 */
export function createEchoesTab(config) {
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
        columns: COLUMNS, cellWidth: cellWidth, cellHeight: 150,
        gap: CELL_VERTICAL_GAP,
        scrollbarPosition: 'left'
    });

    grid.setPosition(0, 0);
    sortController.setPosition(gridComponentWidth + GAP + (SORTER_WIDTH / 2), 0);
    container.add([grid, sortController]);

    const pilotCellFactory = (pilotData, selectedUID) => {
        const cell = new GridItem(scene, {
            width: cellWidth, height: 150,
            iconKey: pilotData.image,
            labelText: `x${pilotData.amount}`,
            rarity: pilotData.rarity,
            tooltipData: {name: pilotData.name}
        });

        cell.bgIdle.setTexture('empty_card_pilot').setDisplaySize(cellWidth, 150);
        cell.bgHover.setTexture('card_pilot').setDisplaySize(cellWidth, 150);
        cell.bgSelected.setTexture('card_pilot').setDisplaySize(cellWidth, 150);
        cell.getAt(3).y = 0;

        if (pilotData.id === selectedUID) cell.setState('selected');
        cell.on('pointerover', () => {
            if (pilotData.id !== selectedUID) cell.setState('hover');
        });
        cell.on('pointerout', () => {
            if (pilotData.id !== selectedUID) cell.setState('idle');
        });
        cell.on('pointerdown', () => {
            if (onItemSelected) onItemSelected(pilotData);
        });

        return cell;
    };

    const populate = (pilots, selectedUID) => {
        grid.populate(pilots, (pilotData) => pilotCellFactory(pilotData, selectedUID));
    };

    sortController.on('sort-selected', onSortChange);

    container.resize = (newHeight) => {
        if (grid && typeof grid.resize === 'function') {
            grid.resize(newHeight);
        }
    };

    return {container, update: populate};
}
