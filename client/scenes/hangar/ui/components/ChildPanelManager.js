import {ChildPanel} from './ChildPanel.js';

export class ChildPanelManager {
    /**
     * @param {Phaser.Scene} scene Сцена Phaser.
     * @param {Phaser.GameObjects.Container} parentContainer Контейнер, внутри которого будут жить панели.
     */
    constructor(scene, parentContainer) {
        this.scene = scene;
        this.parentContainer = parentContainer;

        /** @type {Map<string, function>} */
        this.contentFactories = new Map();

        /** @type {ChildPanel | null} */
        this.activePanel = null;
    }

    register(panelType, createContentFunction) {
        this.contentFactories.set(panelType, createContentFunction);
    }

    show(panelType, data, panelConfig = {}) {
        const createContent = this.contentFactories.get(panelType);
        if (!createContent) {
            console.error(`ChildPanelManager: No content factory registered for type "${panelType}"`);
            return;
        }

        if (this.activePanel && this.activePanel.visible) {

            const newContent = createContent({...data, finalPanelConfig: this.activePanel.config});
            this.activePanel.show(newContent, data.title || panelConfig.title, this.parentContainer);

        } else {
            if (this.activePanel) {
                this.activePanel.destroy();
            }

            this.activePanel = new ChildPanel(this.scene, panelConfig);
            this.parentContainer.parentContainer.add(this.activePanel);

            const newContent = createContent({...data, finalPanelConfig: this.activePanel.config});

            this.activePanel.show(newContent, data.title || panelConfig.title, this.parentContainer);
        }

    }

    hide() {
        if (this.activePanel) {
            this.activePanel.hide();
        }
    }

    destroy() {
        if (this.activePanel) {
            this.activePanel.destroy();
            this.activePanel = null;
        }
        this.contentFactories.clear();
    }
}