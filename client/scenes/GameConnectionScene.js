import Phaser from 'phaser';
import {CONFIG} from './core/config.js';
import {encode, decode} from '@msgpack/msgpack';
import {CMT, MK, MT} from "./core/gameStateKeys";
import LootIdManager from './game/objects/loot/lootIdManager';

export default class GameConnectionScene extends Phaser.Scene {
    constructor() {
        super('GameConnectionScene');
        this.startData = {};
        this.progressBar = null;
        this.progressText = null;
        this.statusText = null;
        this.ws = null;
    }

    init(data) {
        this.startData = data;
    }

    create() {
        this.cameras.main.setBackgroundColor('#050011');
        this.createLoadingUI();
        this.connectToServer();
    }

    createLoadingUI() {
        const {width, height} = this.sys.game.config;

        const logo = this.add.image(width / 2, height / 2 - 100, 'loading_logo').setOrigin(0.5).setScale(0.8);
        this.tweens.add({
            targets: logo,
            scale: 0.85,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.add.text(width / 2, height / 2 + 20, 'CONNECTING', {
            fontFamily: 'Orbitron',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.progressText = this.add.text(width / 2, height / 2 + 55, '0%', {
            fontFamily: 'Orbitron',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.statusText = this.add.text(width / 2, height / 2 + 85, 'Initializing...', {
            fontFamily: 'Tektur',
            fontSize: '16px',
            color: '#cccccc'
        }).setOrigin(0.5);

        const progressBarBg = this.add.graphics();
        progressBarBg.fillStyle(0x333333, 1);
        progressBarBg.fillRoundedRect(width / 2 - 150, height / 2 + 120, 300, 10, 5);
        this.progressBar = this.add.graphics();

        this.updateProgress(0.1, 'Connecting to the gate...');
    }

    updateProgress(value, status) {
        const {width, height} = this.sys.game.config;
        if (this.progressBar) {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x41C6FF, 1);
            this.progressBar.fillRoundedRect(width / 2 - 150, height / 2 + 120, 300 * value, 10, 5);
        }
        if (this.progressText) {
            this.progressText.setText(`${Math.round(value * 100)}%`);
        }
        if (this.statusText) {
            this.statusText.setText(status);
        }
    }

    async connectToServer() {
        const MAX_ATTEMPTS = 3;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                this.updateProgress(0.1 + (0.1 * attempt), `Connecting... (Attempt ${attempt}/${MAX_ATTEMPTS})`);

                this.ws = new WebSocket(CONFIG.servers.game);
                this.ws.binaryType = "arraybuffer";

                const originalClose = this.ws.close;
                this.ws.close = (...args) => {
                    console.error('%c[WS] CLOSE CALLED EXPLICITLY!', 'background: red; color: white; font-size: 14px');
                    console.error('Stack trace:', new Error().stack);
                    originalClose.apply(this.ws, args);
                };

                await new Promise((resolve, reject) => {
                    this.ws.onopen = () => {
                        console.log(`GAME CONNECTION: WebSocket connection OPENED on attempt ${attempt}`);
                        resolve();
                    };
                    this.ws.onerror = (error) => {
                        console.error(`GAME CONNECTION: WebSocket error on attempt ${attempt}:`, error);
                        reject(new Error('Connection error'));
                    };

                    setTimeout(() => reject(new Error('Connection timeout')), 10000);
                });

                this.ws.onmessage = (event) => this.handleServerMessage(event);
                this.ws.onclose = () => console.log('GAME CONNECTION: WebSocket disconnected.');

                this.updateProgress(0.4, 'Connected. Requesting session...');
                const payload = {
                    sessionToken: this.registry.get('session').token,
                    walletAddress: this.startData.walletAddress,
                    map: this.startData.map,
                    startWidth: this.startData.startWidth,
                    startHeight: this.startData.startHeight,
                    shipTokenId: this.startData.shipTokenId,
                    pilotId: this.startData.pilotId
                };
                const message = [CMT.START_GAME_REQUEST, payload];
                this.ws.send(encode(message));

                return;

            } catch (error) {
                console.warn(`Attempt ${attempt} failed: ${error.message}`);
                if (this.ws) {
                    this.ws.close();
                }
                if (attempt === MAX_ATTEMPTS) {
                    this.showError('Could not connect to the game server.');
                    return;
                }

                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }

    handleServerMessage(event) {
        try {
            const data = decode(event.data);
            const type = data[MK.TYPE];
            const payload = data[MK.PAYLOAD];

            switch (type) {
                case MT.SESSION_STARTED:
                    console.log('GAME CONNECTION: Session started successfully.');
                    this.updateProgress(0.8, 'Session data received. Preparing game...');
                    this.prepareAndStartGame(payload);
                    break;
                case MT.ERROR:

                    if (payload && payload.code === 'RETRY_LATER') {
                        console.warn('GAME CONNECTION: Server requested a retry. Terminating old session.');
                        this.handleRetryableError();
                    } else {

                        console.error('GAME CONNECTION: Server returned error:', payload);
                        this.showError(payload.message || 'Server error.');
                    }
                    break;
                default:
                    console.warn(`GAME CONNECTION: Received unexpected message type: ${type}`);
            }
        } catch (e) {
            console.error('GAME CONNECTION: Failed to decode or handle message:', e);
            this.showError('Received invalid data from server.');
        }
    }

    handleRetryableError() {
        const RETRY_DELAY = 2000;

        this.updateProgress(0.5, `Finalizing previous session... Retrying in ${RETRY_DELAY / 1000}s.`);

        if (this.ws) {

            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.close();
        }

        this.time.delayedCall(RETRY_DELAY, () => {

            this.connectToServer();
        });
    }

    prepareAndStartGame(payload) {
        console.log('[ConnectionScene] Server Time:', payload.serverTime);

        if (payload.lootDictionary) {
            LootIdManager.initialize(payload.lootDictionary);
        } else {
            console.error("CRITICAL: No lootDictionary received from server!");
            this.showError('Critical error: Missing game data.');
            return;
        }

        const gameData = {
            ...this.startData,
            ws: this.ws,
            ...payload
        };

        this.ws.onmessage = null;
        this.ws.onclose = null;
        this.ws.onerror = null;

        this.updateProgress(1.0, 'Starting game...');

        this.scene.start('GameScene', gameData);
    }

    showError(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.onmessage = null;
        }
        this.statusText.setText(`ERROR: ${message}`).setColor('#ff0000');
        this.progressBar.clear();

        const backButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 120, 'BACK TO HANGAR', {
            fontFamily: 'Tektur',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#1a2b3c',
            padding: {x: 20, y: 10}
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        backButton.on('pointerdown', () => {
            if (this.ws) this.ws.close();
            this.scene.start('HangarConnectionScene', {walletAddress: this.startData.walletAddress});
        });
    }
}
