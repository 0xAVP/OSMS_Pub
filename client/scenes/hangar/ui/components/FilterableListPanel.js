import {ScrollableList} from './ScrollableList.js';
import {SortController} from './SortController.js';

const GAP = 20;
const SORTER_WIDTH = 50;

/**
 * Создает универсальную панель с боковым меню фильтров и прокручиваемым списком.
 */
export class FilterableListPanel extends Phaser.GameObjects.Container {
    /**
     * @param {object} config - Конфигурация.
     * @param {Phaser.Scene} config.scene - Сцена.
     * @param {number} config.availableHeight - Доступная высота для списка.
     * @param {number} config.totalWidth - Общая ширина, которую должен занять компонент.
     * @param {Array<object>} config.sortButtons - Массив конфигураций кнопок для SortController.
     * @param {function(object, any):Phaser.GameObjects.GameObject} config.itemFactory - Фабричная функция для создания элемента списка.
     * @param {function(string):void} [config.onSortChange] - Колбэк при смене фильтра.
     * @param {'left' | 'right'} [config.sorterPosition='left'] - Позиция панели сортировки.
     * @param {'left' | 'right'} [config.scrollbarPosition='right'] - Позиция скроллбара.
     */
    constructor(config) {

        const {
            scene,
            availableHeight,
            totalWidth,
            sortButtons,
            itemFactory,
            onSortChange,
            sorterPosition = 'left',
            scrollbarPosition = 'right'
        } = config;

        super(scene, 0, 0);

        this.itemFactory = itemFactory;

        const listWidth = totalWidth - SORTER_WIDTH - GAP;

        this.sortController = new SortController(scene, {buttons: sortButtons, buttonWidth: SORTER_WIDTH});

        this.scrollableList = new ScrollableList(scene, {
            width: listWidth,
            height: availableHeight,
            scrollbarPosition: scrollbarPosition,
        });

        if (sorterPosition === 'left') {
            this.sortController.setPosition(SORTER_WIDTH / 2, 0);
            this.scrollableList.setPosition(SORTER_WIDTH + GAP, 0);
        } else {
            this.scrollableList.setPosition(0, 0);
            this.sortController.setPosition(listWidth + GAP + (SORTER_WIDTH / 2), 0);
        }

        this.sortController.on('sort-selected', (sortId) => {
            if (onSortChange) {
                onSortChange(sortId);
            }
        });

        this.add([this.sortController, this.scrollableList]);
        scene.add.existing(this);
    }

    update(itemsToDisplay, selectedId) {
        this.scrollableList.populate(itemsToDisplay, (itemData) => this.itemFactory(itemData, selectedId));
    }

    resize(newHeight) {
        if (this.scrollableList && typeof this.scrollableList.resize === 'function') {
            this.scrollableList.resize(newHeight);
        }
    }
}