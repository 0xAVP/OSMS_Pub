import {SidePanel} from './components/SidePanel.js';
import {createCraftPanelContent} from './panels/CraftPanel.js';
import {createUpgradePanelContent} from './panels/UpgradePanel.js';
import {createInventoryPanelContent} from './panels/InventoryPanel.js';
import {SendItemPanel} from './panels/SendItemPanel.js';
import {createMailPanelContent} from './panels/MailPanel.js';
import {PilotSelectionPanelContent} from './panels/PilotSelectionPanelContent.js';
import {ShipStatusPanel} from './panels/ShipStatusPanel.js';
import {ReplaceModulePanel} from './panels/ReplaceModulePanel.js';
import {createAccountPanelContent} from './panels/AccountPanel.js';
import {createLeaderboardPanelContent} from './panels/LeaderboardPanel.js';
import {ConfirmationModal} from './components/confirmCancelModal.js';
import {MintShipModal} from './panels/mint/MintShipModal.js';
import {TransactionHistoryModal} from './modals/history/TransactionHistoryModal.js';

export function registerAllPanels(scene) {
    if (scene.sidePanelManager) {
        const sidePanelConfigs = [
            {
                id: 'craft',
                position: 'left',
                title: 'CRAFTING STATION',
                panelComponent: SidePanel,
                width: 500,
                height: null,
                align: 'bottom',
                createContent: (config) => createCraftPanelContent(scene, config)
            },
            {
                id: 'upgrade',
                position: 'left',
                title: 'UPGRADE STATION',
                panelComponent: SidePanel,
                width: 500,
                height: null,
                align: 'bottom',
                createContent: (config) => createUpgradePanelContent(scene, config)
            },
            {
                id: 'inventory',
                position: 'left',
                title: 'INVENTORY',
                panelComponent: SidePanel,
                width: 575,
                height: null,
                align: 'bottom',
                createContent: (config) => createInventoryPanelContent(scene, config)
            },
            {
                id: 'mail',
                position: 'left',
                title: 'MAILBOX',
                panelComponent: SidePanel,
                width: 650,
                height: null,
                align: 'bottom',
                createContent: (config) => createMailPanelContent(scene, config)
            },
            {
                id: 'account',
                position: 'right',
                title: 'PLAYER ACCOUNT',
                panelComponent: SidePanel,
                width: 575,
                height: null,
                align: 'bottom',
                createContent: (config) => createAccountPanelContent(scene, config)
            },
            {
                id: 'leaderboard',
                position: 'right',
                title: 'LEADERBOARD',
                panelComponent: SidePanel,
                width: 575,
                height: null,
                align: 'bottom',
                createContent: (config) => createLeaderboardPanelContent(scene, config)
            },
            {
                id: 'ship',
                position: 'left',
                title: 'SHIP SYSTEMS',
                panelComponent: SidePanel,
                width: 350,
                height: null,
                align: 'bottom',
                createContent: (config) => new ShipStatusPanel(scene, config)
            },

            {
                id: 'replaceModule',
                position: 'right',
                title: 'INSTALLATION MODE',
                panelComponent: SidePanel,
                width: 460,
                height: null,
                align: 'bottom',

                createContent: (panelConfig, data) => {
                    const replacePanel = new ReplaceModulePanel(scene, panelConfig);

                    if (data) {
                        replacePanel.setData(data);
                    }
                    return replacePanel;
                }
            },

            {
                id: 'pilotSelector',
                position: 'top',
                title: '',
                panelComponent: SidePanel,
                width: 260,
                height: 292,
                handleSize: 40,
                alignX: 'left',
                offsetX: 60,
                createContent: (config) => new PilotSelectionPanelContent(scene, config)
            },
        ];

        sidePanelConfigs.forEach(config => {
            scene.sidePanelManager.registerPanel(config);
        });
        console.log('Все боковые панели успешно зарегистрированы.');
    } else {
        console.error('SidePanelManager не инициализирован.');
    }

    if (scene.modalManager) {
        scene.modalManager.register('sendItem', (itemData) => {
            return new SendItemPanel(scene, itemData);
        });
        scene.modalManager.register('confirm', (config) => {

            return new ConfirmationModal(scene, config);
        });
        scene.modalManager.register('mintShip', (data) => {

            return new MintShipModal(scene, data.availableShips);
        });
        scene.modalManager.register('transactionHistory', (data) => {
            return new TransactionHistoryModal(scene, data);
        });
        console.log('Все модальные панели успешно зарегистрированы.');
    } else {
        console.error('ModalManager не инициализирован.');
    }
}
