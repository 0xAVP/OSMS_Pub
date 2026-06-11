import Phaser from 'phaser';
import {createScene} from './create.js';
import {toggleFullscreen} from './fullscreen.js';
import {selectPilot, selectShip} from './selection.js';
import {checkExpiredBuffs} from '../shared/BuffService.js';
import {cleanUpHangarScene, destroyOnError} from './_CleanUp.js';
import {CONFIG} from "../core/config";
import {checkSession} from "./session";
import {webSocketManager} from './WebSocketManager.js';
import {setActualExp} from "./wallet/inventory";
import {SidePanelManager} from './ui/components/SidePanelManager.js';
import {registerAllPanels} from './ui/UIPanels.js';
import {ModalManager} from './ui/components/ModalManager.js';
import {ActionService} from './ui/processing/ActionService.js';

export default class HangarScene extends Phaser.Scene {
    constructor() {
        super('HangarScene');
        this.sidePanelManager = null;
        this.modalManager = null;
        this.actionService = null;

        this.walletConnected = false;
        this.hasPilot = false;

        this.catalog = {};
        this.availableShips = [];
        this.selectedPilot = null;
        this.selectedShip = null;
        this.mapOptions = [0, 1, 2];
        this.currentMapIndex = 0;
        this.uiElements = [];
        this.walletAddress = null;

        this.deskContainer = null;
        this.centralContainer = null;
        this.shipContainer = null;
        this.navContainer = null;
        this.desk = null;
        this.startGameButton = null;
        this.fullscreenButton = null;
        this.shipSprite = null;
        this.pilotImage = null;
        this.mintContainer = null;
        this.loadingLabel = null;
    }

    init(data) {
        console.log('HangarScene INIT:', data);
        this.provider = data.provider;
        this.signer = data.signer;
        this.pilotContract = data.pilotContract;
        this.shipNFTContract = data.shipNFTContract;
        this.shipManagerContract = data.shipManagerContract;
        this.tokenMinterContract = data.tokenMinterContract;
        this.osmsTokenContract = data.osmsTokenContract;
        this.walletAddress = data.walletAddress || null;
        this.navigate = data.navigate || null;

        this.pilots = data.pilots || [];
        this.ships = data.ships || [];
        this.inventoryItems = data.inventoryItems || {};
        this.catalog = data.catalog || {};
        this.craftFactories = data.craftFactories || {};
        this.mailData = data.mailData || {inbox: [], sent: []};

        this.registry.set('active_buffs', data.activeBuffs || {});
        this.registry.set('catalog_data', this.catalog);
        this.registry.set('catalogs_loaded', !!this.catalog);

        this.actualExp = data.actualExp || 0;

        if (this.pilots.length > 0) {

            const lastUsedPilot = this.pilots.find(p => p.id === data.selectedPilotId);
            this.selectedPilot = lastUsedPilot || this.pilots[0];
        } else {
            this.selectedPilot = null;
        }

        if (this.ships.length > 0) {

            const lastUsedShip = this.ships.find(s => s.shipId === data.selectedShipId);
            this.selectedShip = lastUsedShip || this.ships[0];
            console.log('Initial selected ship:', this.selectedShip);
        } else {
            this.selectedShip = null;
        }
    }

    create() {
        this.sidePanelManager = new SidePanelManager(this);
        this.modalManager = new ModalManager(this);
        this.actionService = new ActionService(this);
        registerAllPanels(this);

        this.handleNewMail = (payload) => {
            console.log('HangarScene received new mail:', payload);
            if (this.mailData && this.mailData.inbox) {
                const newMail = payload.mail;
                if (this.sysMessageContainer) {
                    this.sysMessageContainer.addMessage(`New mail received: [color=#e0e0e0]${newMail.subject}[/color]`, 'DEFAULT');
                }
                this.mailData.inbox.unshift(newMail);
                if (this.mailData.inbox.length > 50) this.mailData.inbox.pop();
                this.events.emit('mail-list-changed');
            }
        };

        this.handleExpUpdate = (payload) => {
            console.log('HangarScene received exp update:', payload);

            setActualExp.call(this, payload.exp);
        };

        this.handleConnectionReplaced = () => {
            console.error('Connection replaced by a new session. Destroying HangarScene.');
            if (this.sysMessageContainer) {
                this.sysMessageContainer.addMessage('Session outdated. Please reload.', 'ERROR');
            }

            this.destroyOnError();
        };

        this.handleTxHistoryUpdate = () => {
            console.log('HangarScene: Transaction History Update received via WS');

            this.events.emit('tx-history-updated');
        };

        webSocketManager.on('new-mail', this.handleNewMail);
        webSocketManager.on('actual-exp', this.handleExpUpdate);
        webSocketManager.on('connection-replaced', this.handleConnectionReplaced);
        webSocketManager.on('tx-history-updated', this.handleTxHistoryUpdate);

        createScene.call(this);

        if (this.pilots && this.pilots.length > 0) {
            this.sidePanelManager.open('pilotSelector');
        }

    }

    update(time, delta) {
        checkExpiredBuffs(this);
    }

    selectPilot(direction) {
        selectPilot.call(this, direction);

        const pilotPanel = this.sidePanelManager.activePanels.get('pilotSelector');
        if (pilotPanel && pilotPanel.content && typeof pilotPanel.content.updateContent === 'function') {
            pilotPanel.content.updateContent();
        }
    }

    selectShip(direction) {
        selectShip.call(this, direction);
    }

    toggleFullscreen() {
        toggleFullscreen.call(this);
    }

    destroyOnError() {
        destroyOnError.call(this);
    }

    shutdown() {
    }

    async startGame(mapIndex, startWidth, startHeight) {
        const session = await checkSession(this);
        if (!session.isValid) {
            this.sysMessageContainer.addMessage(session.message || 'Session is invalid', 'WARNING');
            console.warn('Start game blocked: Invalid session');
            return;
        }
        if (!this.selectedShip || !this.selectedPilot) {
            this.sysMessageContainer.addMessage('You must have an Echo and a Ship to start!', 'WARNING');
            return;
        }
        const finalWidth = Math.floor(startWidth || window.innerWidth);
        const finalHeight = Math.floor(startHeight || window.innerHeight);

        if (finalWidth < CONFIG.client.validation.MIN_CANVAS_WIDTH || finalHeight < CONFIG.client.validation.MIN_CANVAS_HEIGHT) {
            const errorMsg = `Minimum resolution is ${CONFIG.client.validation.MIN_CANVAS_WIDTH}x${CONFIG.client.validation.MIN_CANVAS_HEIGHT}.`;
            this.sysMessageContainer.addMessage(errorMsg, 'ERROR');
            return;
        }

        let simulationWidth = finalWidth;
        let simulationHeight = finalHeight;

        if (finalWidth > CONFIG.client.validation.MAX_CANVAS_WIDTH || finalHeight > CONFIG.client.validation.MAX_CANVAS_HEIGHT) {
            const warningMsg = `Your resolution is very high. The game will run at a maximum of ${CONFIG.client.validation.MAX_CANVAS_WIDTH}x${CONFIG.client.validation.MAX_CANVAS_HEIGHT} for performance.`;
            this.sysMessageContainer.addMessage(warningMsg, 'WARNING', 5000);

            simulationWidth = Math.min(finalWidth, CONFIG.client.validation.MAX_CANVAS_WIDTH);
            simulationHeight = Math.min(finalHeight, CONFIG.client.validation.MAX_CANVAS_HEIGHT);
        }

        simulationWidth = Math.min(finalWidth, CONFIG.client.validation.MAX_CANVAS_WIDTH);
        simulationHeight = Math.min(finalHeight, CONFIG.client.validation.MAX_CANVAS_HEIGHT);
        console.log(simulationWidth, simulationHeight);

        this.events.once('shutdown', () => {
            console.log('%cEvent: HangarScene shutdown event caught.', '...');
            cleanUpHangarScene.call(this);
            this.scene.manager.start('GameConnectionScene', {

                shipTokenId: this.selectedShip.shipId,
                pilotId: this.selectedPilot.id,
                map: mapIndex,
                walletAddress: this.walletAddress,
                isFullscreen: this.scale.isFullscreen,
                startWidth: simulationWidth,
                startHeight: simulationHeight,
            });
        });
        this.scene.stop();
        console.log('Stop command issued for HangarScene. Waiting for shutdown event...');
    }
}