const logger = require('../../core/logger');

class StaticSpawnGrid {
    /**
     * @param {object} zone - Область, которую покрывает сетка { xMin, xMax, yMin, yMax }.
     * @param {number} cellSize - Размер ячейки.
     */
    constructor(zone, cellSize) {
        this.zone = zone;
        this.cellSize = cellSize;
        this.invCellSize = 1 / cellSize;
        this.cols = Math.ceil((zone.xMax - zone.xMin) * this.invCellSize);
        this.rows = Math.ceil((zone.yMax - zone.yMin) * this.invCellSize);

        this.freeCells = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {

                this.freeCells.push({c, r});
            }
        }

        this._shuffleArray(this.freeCells);

        logger.debug(`[StaticSpawnGrid] Initialized with ${this.cols}x${this.rows} cells (${this.freeCells.length} total) of size ${cellSize.toFixed(0)}px.`);
    }

    /**
     * Алгоритм тасования Фишера-Йетса.
     * @private
     */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    occupyRandomFreeCell() {
        if (this.freeCells.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * this.freeCells.length);

        const chosenCell = this.freeCells[randomIndex];

        const lastCell = this.freeCells.pop();
        if (randomIndex < this.freeCells.length) {
            this.freeCells[randomIndex] = lastCell;
        }

        return chosenCell;

    }

    /**
     * Преобразует координаты ячейки в мировые координаты ее центра.
     * @param {number} c - колонка.
     * @param {number} r - ряд.
     * @returns {{x: number, y: number}} Мировые координаты.
     */
    getCellCenterWorldCoords(c, r) {
        const x = this.zone.xMin + (c + 0.5) * this.cellSize;
        const y = this.zone.yMin + (r + 0.5) * this.cellSize;
        return {x, y};
    }

    releaseCell(cellCoords) {
        if (cellCoords && typeof cellCoords.c === 'number' && typeof cellCoords.r === 'number') {

            this.freeCells.push(cellCoords);

        }
    }
}

module.exports = StaticSpawnGrid;