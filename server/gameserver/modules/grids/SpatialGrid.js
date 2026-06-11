const CONFIG = require('../../core/config');

/**
 * Эффективная пространственная сетка для отслеживания ТЕКУЩЕГО положения сущностей.
 * Оптимизирована для минимизации аллокаций памяти (мусора для GC) и быстрых
 * операций добавления, удаления и запроса.
 */
class SpatialGrid {
    /**
     * @param {number} worldWidth Ширина игрового мира.
     * @param {number} worldHeight Высота игрового мира.
     * @param {number} [cellSize=200] Размер одной квадратной ячейки сетки.
     */
    constructor(worldWidth, worldHeight, cellSize = CONFIG.performance.GRID_CELL_SIZE) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(worldWidth / this.cellSize);
        this.rows = Math.ceil(worldHeight / this.cellSize);
        this.invCellSize = 1 / cellSize;

        /**
         * Основное хранилище.
         * Ключ (string): "col,row" - координата ячейки.
         * Значение (Set<number>): Множество уникальных ID сущностей в этой ячейке.
         * Использование Set вместо Array критически важно:
         * 1. Вставка/удаление в среднем за O(1).
         * 2. Автоматическая обработка дубликатов.
         * @type {Map<string, Set<number>>}
         */
        this.grid = new Map();
    }

    /**
     * Вычисляет строковый ключ ячейки для заданных координат.
     * Не создает временных объектов.
     * @param {number} x
     * @param {number} y
     * @returns {string} Ключ ячейки, например, "5,10".
     */
    getKeyForPos(x, y) {

        const col = Math.floor(x * this.invCellSize);
        const row = Math.floor(y * this.invCellSize);
        return `${col},${row}`;
    }

    /**
     * Обновляет положение сущности в гриде.
     * Обрабатывает перемещение из одной ячейки в другую.
     * @param {number} entityId - ID сущности.
     * @param {string|null} oldKey - Предыдущий ключ ячейки (или null, если сущность новая).
     * @param {string} newKey - Новый ключ ячейки.
     */
    update(entityId, oldKey, newKey) {
        if (oldKey === newKey) {
            return;
        }

        if (oldKey) {
            const oldCell = this.grid.get(oldKey);
            if (oldCell) {
                oldCell.delete(entityId);

                if (oldCell.size === 0) {
                    this.grid.delete(oldKey);
                }
            }
        }

        let newCell = this.grid.get(newKey);
        if (!newCell) {

            newCell = new Set();
            this.grid.set(newKey, newCell);
        }
        newCell.add(entityId);
    }

    /**
     * Удаляет сущность из грида (используется при уничтожении сущности).
     * @param {number} entityId
     * @param {string} key
     */
    remove(entityId, key) {
        if (!key) return;

        const cell = this.grid.get(key);
        if (cell) {
            cell.delete(entityId);
            if (cell.size === 0) {
                this.grid.delete(key);
            }
        }
    }

    /**
     * Находит всех уникальных кандидатов в указанной области.
     * @param {object} queryBounds - Область запроса { x, y, width, height }.
     * @param {Set<number>} resultsSet - Ссылка на Set, который будет наполнен результатами.
     *                                   Передача Set'а позволяет избежать его создания на каждом кадре.
     */
    query(queryBounds, resultsSet) {

        resultsSet.clear();

        const startCol = Math.floor(queryBounds.x * this.invCellSize);
        const endCol = Math.floor((queryBounds.x + queryBounds.width) * this.invCellSize);
        const startRow = Math.floor(queryBounds.y * this.invCellSize);
        const endRow = Math.floor((queryBounds.y + queryBounds.height) * this.invCellSize);

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const key = `${c},${r}`;
                const cell = this.grid.get(key);
                if (cell) {

                    for (const entityId of cell) {
                        resultsSet.add(entityId);
                    }
                }
            }
        }
    }
}

module.exports = SpatialGrid;