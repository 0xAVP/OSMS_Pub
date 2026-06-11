/**
 * Эффективная реализация кольцевого буфера (Circular Buffer) фиксированного размера.
 * Обеспечивает вставку за O(1) и избегает перераспределения памяти.
 * Эта версия оптимизирована для минимизации аллокаций памяти при чтении.
 */
class CircularBuffer {
    /**
     * @param {number} capacity Максимальное количество элементов в буфере.
     */
    constructor(capacity) {
        if (capacity <= 0) {
            throw new Error("Capacity must be a positive number.");
        }
        this.capacity = capacity;
        this.buffer = new Array(capacity);
        this.head = 0;
        this.size = 0;
    }

    /**
     * Добавляет новый элемент в буфер. Если буфер полон, самый старый элемент будет перезаписан.
     * @param {*} item Элемент для добавления.
     * @returns {*|null} Возвращает перезаписанный элемент (для возврата в пул) или null, если буфер еще не был полон.
     */
    push(item) {

        let overwritten = null;

        if (this.size === this.capacity) {
            overwritten = this.buffer[this.head];
        }

        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this.size < this.capacity) {
            this.size++;
        }

        return overwritten;
    }

    /**
     * Реализация протокола итератора.
     * Позволяет использовать буфер в цикле `for...of` без создания нового массива.
     * @returns {Generator<*, void, *>}
     */
    * [Symbol.iterator]() {
        const start = (this.size === this.capacity) ? this.head : 0;
        for (let i = 0; i < this.size; i++) {
            const sourceIndex = (start + i) % this.capacity;
            yield this.buffer[sourceIndex];
        }
    }

    /**
     * Возвращает все элементы буфера в виде нового, хронологически отсортированного массива.
     * @returns {Array<*>}
     */
    toArray() {
        const result = new Array(this.size);
        const start = (this.size === this.capacity) ? this.head : 0;
        for (let i = 0; i < this.size; i++) {
            const sourceIndex = (start + i) % this.capacity;
            result[i] = this.buffer[sourceIndex];
        }
        return result;
    }

    /**
     * Возвращает текущее количество элементов в буфере.
     * @returns {number}
     */
    length() {
        return this.size;
    }

    /**
     * Очищает буфер, сбрасывая его состояние к начальному (пустому).
     */
    reset() {
        this.head = 0;
        this.size = 0;
    }

    /**
     * "Осушает" буфер, возвращая все хранимые в нем элементы в виде массива.
     * После вызова буфер становится пустым. Это необходимо для возврата всех
     * объектов-снимков в пул при уничтожении сущности.
     * @returns {Array<*>} Массив всех хранившихся элементов.
     */
    drain() {
        const allItems = this.toArray();
        this.reset();
        return allItems;
    }

    /**
     * Возвращает элемент по его логическому индексу (от 0 до size-1).
     * @param {number} logicalIndex - Логический индекс.
     * @returns {*} Элемент буфера.
     * @private
     */
    _get(logicalIndex) {

        const start = (this.size === this.capacity) ? this.head : 0;

        const physicalIndex = (start + logicalIndex) % this.capacity;
        return this.buffer[physicalIndex];
    }

    /**
     * Находит два временных снимка, окружающих заданную временную метку,
     * используя эффективный алгоритм бинарного поиска.
     * @param {number} targetTimestamp - Временная метка, для которой нужно найти окружение.
     * @returns {{snapshotA: object|null, snapshotB: object|null}}
     *          snapshotA: последний снимок, время которого <= targetTimestamp.
     *          snapshotB: первый снимок, время которого > targetTimestamp.
     */
    findSnapshotsForTime(targetTimestamp) {

        if (this.size === 0) {
            return {snapshotA: null, snapshotB: null};
        }

        const firstSnapshot = this._get(0);
        if (targetTimestamp < firstSnapshot.timestamp) {

            return {snapshotA: null, snapshotB: firstSnapshot};
        }

        const lastSnapshot = this._get(this.size - 1);
        if (targetTimestamp >= lastSnapshot.timestamp) {

            return {snapshotA: lastSnapshot, snapshotB: null};
        }

        let low = 0;
        let high = this.size - 1;
        let midLogical = 0;

        while (low <= high) {
            midLogical = Math.floor(low + (high - low) / 2);
            const currentSnapshot = this._get(midLogical);

            if (currentSnapshot.timestamp === targetTimestamp) {

                const nextSnapshot = (midLogical + 1 < this.size) ? this._get(midLogical + 1) : null;
                return {snapshotA: currentSnapshot, snapshotB: nextSnapshot};
            }

            if (currentSnapshot.timestamp < targetTimestamp) {
                low = midLogical + 1;
            } else {
                high = midLogical - 1;
            }
        }

        return {
            snapshotA: this._get(high),
            snapshotB: this._get(low)
        };
    }
}

module.exports = CircularBuffer;
