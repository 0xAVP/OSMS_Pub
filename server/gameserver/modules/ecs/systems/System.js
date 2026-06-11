const logger = require("../../../core/logger");

/**
 * Базовый класс для всех систем.
 * Пока не содержит логики, но задает структуру.
 */
class System {
    constructor() {

    }

    update() {
        throw new Error('System.update() должен быть реализован в классе-наследнике');
    }
}

module.exports = System;