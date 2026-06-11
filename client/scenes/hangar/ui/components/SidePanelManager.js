/**
 * @class SidePanelManager
 * @description Управляет жизненным циклом боковых панелей (SidePanel).
 * Отвечает за их регистрацию, открытие, закрытие и предотвращение конфликтов (например,
 * открытия двух панелей с одной стороны). Является центральной точкой входа для
 * управления панелями в сцене.
 */
export class SidePanelManager {
    /**
     * @param {Phaser.Scene} scene Сцена, в которой будет работать менеджер.
     */
    constructor(scene) {
        /** @type {Phaser.Scene} */
        this.scene = scene;

        /**
         * @private
         * @type {Map<string, object>}
         */
        this.panelConfigs = new Map();

        /**
         * @private
         * @type {Map<string, any>}
         */
        this.activePanels = new Map();

        /**
         * @private
         * @type {Map<string, string[]>}
         * Хранит зависимости. Ключ - ID родительской панели, значение - массив ID дочерних.
         */
        this.panelDependencies = new Map([
            ['ship', ['replaceModule']]
        ]);

    }

    /**
     * Регистрирует новую панель в менеджере.
     * @param {object} config - Конфигурация панели.
     */
    registerPanel(config) {
        if (this.panelConfigs.has(config.id)) {
            console.warn(`SidePanelManager: Панель с id "${config.id}" уже зарегистрирована.`);
            return;
        }
        this.panelConfigs.set(config.id, config);
    }

    open(id, data = null) {
        if (!this.panelConfigs.has(id)) {
            console.error(`SidePanelManager: Попытка открыть незарегистрированную панель с id "${id}".`);
            return;
        }
        if (this.isOpen(id)) {
            console.log(`SidePanelManager: Панель "${id}" уже открыта.`);

            const panelInstance = this.activePanels.get(id);
            if (panelInstance.content && typeof panelInstance.content.setData === 'function') {
                panelInstance.content.setData(data);
            }
            return;
        }

        const config = this.panelConfigs.get(id);

        for (const [panelId, panelInstance] of this.activePanels.entries()) {
            if (panelInstance.config.position === config.position) {
                this.close(panelId);
            }
        }

        if (typeof config.createContent !== 'function') {
            console.error(`SidePanelManager: Для панели с id "${id}" не определена функция createContent.`);
            return;
        }

        const sceneWidth = this.scene.scale.width;
        const sceneHeight = this.scene.scale.height;
        const deskContainer = this.scene.deskContainer;
        const deskHeight = deskContainer ? deskContainer.getBounds().height : 0;

        const availablePanelHeight = sceneHeight - deskHeight + 100;

        const initialSizeData = {
            width: sceneWidth,
            height: sceneHeight,
            availablePanelHeight: availablePanelHeight
        };

        const finalConfig = {...config, initialSizeData: initialSizeData};

        const content = config.createContent(finalConfig, data);
        const PanelComponent = config.panelComponent;
        const panelInstance = new PanelComponent(this.scene, {...finalConfig, content});

        panelInstance.on('close-side-panel-request', (panelId) => {
            this.close(panelId);
        });

        panelInstance.on('closed', () => {
            this.activePanels.delete(id);
        });

        this.activePanels.set(id, panelInstance);
        panelInstance.show();

        this.scene.events.emit('side-panel-opened', {id, position: config.position});
    }

    /**
     * Закрывает панель по ее ID и все зависимые от нее панели.
     * @param {string} id - Идентификатор панели для закрытия.
     */

    close(id) {

        const dependencies = this.panelDependencies.get(id);
        if (dependencies) {
            dependencies.forEach(childId => {
                if (this.isOpen(childId)) {
                    this.close(childId);
                }
            });
        }

        if (this.activePanels.has(id)) {
            const panelInstance = this.activePanels.get(id);
            panelInstance.hide();
            this.scene.events.emit('side-panel-closed', {id});
        }
    }

    /**
     * Проверяет, открыта ли панель.
     * @param {string} id - Идентификатор панели.
     * @returns {boolean}
     */
    isOpen(id) {
        return this.activePanels.has(id);
    }

    /**
     * Уничтожает менеджер и все активные панели.
     */
    destroy() {
        for (const panelInstance of this.activePanels.values()) {
            panelInstance.destroy();
        }

        this.panelConfigs.clear();
        this.activePanels.clear();
        console.log('SidePanelManager уничтожен.');
    }
}
