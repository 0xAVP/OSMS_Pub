/**
 * Универсальный класс для управления пулом переиспользуемых объектов.
 * Снижает нагрузку на сборщик мусора, переиспользуя старые объекты вместо создания новых.
 */
class ObjectPool {
    /**
     * @param {function} factory Функция, которая знает, как создать новый экземпляр объекта, если пул пуст.
     */
    constructor(factory) {
        if (typeof factory !== 'function') {
            throw new Error('ObjectPool factory must be a function.');
        }
        this._factory = factory;
        this._pool = [];
    }

    /**
     * Получает объект из пула.
     * Если в пуле есть свободные объекты, возвращает один из них.
     * В противном случае создает новый объект с помощью фабричной функции.
     * @returns {*} Готовый к использованию объект.
     */
    acquire() {
        if (this._pool.length > 0) {

            return this._pool.pop();
        }

        return this._factory();
    }

    /**
     * Возвращает объект обратно в пул для дальнейшего переиспользования.
     * Перед возвратом объект должен быть сброшен в начальное состояние.
     * @param {*} obj Объект для возврата в пул.
     */
    release(obj) {
        this._pool.push(obj);
    }
}

module.exports = ObjectPool;