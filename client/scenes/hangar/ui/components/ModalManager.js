/**
 * @class ModalManager
 * @description Управляет жизненным циклом глобальных модальных окон в сцене.
 * Гарантирует, что только одно модальное окно может быть открыто в один момент времени.
 */
export class ModalManager {
    /**
     * @param {Phaser.Scene} scene Сцена, в которой будет работать менеджер.
     */
    constructor(scene) {
        /** @type {Phaser.Scene} */
        this.scene = scene;

        /**
         * @private
         * @type {Map<string, function(any): Phaser.GameObjects.Container>}
         * Хранит "фабрики" для создания модальных окон.
         * Ключ - id окна, значение - функция, которая его создает и возвращает.
         */
        this.modalFactories = new Map();

        /**
         * @private
         * @type {Phaser.GameObjects.Container | null}
         * Хранит ссылку на текущее активное (открытое) модальное окно.
         */
        this.activeModal = null;
    }

    /**
     * Регистрирует новую фабрику модального окна в менеджере.
     * @param {string} modalId - Уникальный идентификатор модального окна (например, 'sendItem').
     * @param {function(any): Phaser.GameObjects.Container} createFunction - Функция, которая принимает данные и возвращает экземпляр модального окна.
     */
    register(modalId, createFunction) {
        if (this.modalFactories.has(modalId)) {
            console.warn(`ModalManager: Модальное окно с id "${modalId}" уже зарегистрировано.`);
            return;
        }
        this.modalFactories.set(modalId, createFunction);
    }

    /**
     * Создает и показывает модальное окно по его ID.
     * @param {string} modalId - Идентификатор модального окна для открытия.
     * @param {any} [data] - Необязательные данные, которые будут переданы в фабрику модального окна.
     */
    show(modalId, data) {
        if (this.activeModal) {
            console.warn(`ModalManager: Попытка открыть модальное окно "${modalId}", когда другое уже активно.`);
            return;
        }

        if (!this.modalFactories.has(modalId)) {
            console.error(`ModalManager: Попытка открыть незарегистрированное модальное окно с id "${modalId}".`);
            return;
        }

        const factory = this.modalFactories.get(modalId);
        const modalInstance = factory(data);

        this.activeModal = modalInstance;

        modalInstance.once('close', () => {
            if (this.activeModal === modalInstance) {
                this.activeModal = null;

            }
        });

    }

    /**
     * Закрывает текущее активное модальное окно.
     */
    hide() {
        if (this.activeModal && typeof this.activeModal.hide === 'function') {
            this.activeModal.hide();
        }
    }

    /**
     * Уничтожает менеджер и все активные модальные окна.
     */
    destroy() {
        if (this.activeModal) {
            this.activeModal.destroy();
        }
        this.activeModal = null;
        this.modalFactories.clear();
        console.log('ModalManager уничтожен.');
    }
}