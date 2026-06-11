import Phaser from 'phaser';
import {initializeWeb3} from './hangar/wallet/connect.js';
import {checkSession} from './hangar/session.js';
import {loadPilotsAndShips} from './hangar/wallet/pilots.js';
import {webSocketManager} from './hangar/WebSocketManager.js';
import TextButton from "./shared/components/TextButton";
import {LOADING_TIPS} from './loadingTips.js';
import {CONFIG} from './core/config.js';

export default class HangarConnectionScene extends Phaser.Scene {
    constructor() {
        super('HangarConnectionScene');
    }

    init(data) {
        console.log('HangarConnectionScene INIT:', data);
        this.startData = data;
        if (data.navigate) {
            this.navigate = data.navigate;
        }
    }

    create() {
        console.log('%c--- HangarConnectionScene CREATE ---', 'color: green; font-weight: bold;');
        this.cameras.main.setBackgroundColor('#050011');
        this.createLoadingUI();
        this.loadInitialData();
    }

    cleanUpConnectionScene() {
        console.log('HangarConnectionScene: Cleaning up socket before exit.');
        if (webSocketManager) {
            webSocketManager.disconnect();
        }
    }

    createLoadingUI() {
        this.loadingUI = this.add.container(0, 0);
        const {width, height} = this.sys.game.config;

        const logo = this.add.image(width / 2, height / 2 - 100, 'loading_logo').setScale(0.8);
        this.tweens.add({
            targets: logo,
            scale: 0.85,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        const loadingLabel = this.add.text(width / 2, height / 2 + 20, 'CONNECTING', {
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

        const randomTip = Phaser.Utils.Array.GetRandom(LOADING_TIPS);

        const tipLabel = this.add.text(width / 2, height - 100, '💡 PRO TIP:', {
            fontFamily: 'Orbitron',
            fontSize: '14px',
            color: '#FEBA00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const tipText = this.add.text(width / 2, height - 70, randomTip, {
            fontFamily: 'Tektur',
            fontSize: '16px',
            color: '#aaaaaa',
            align: 'center',
            wordWrap: {width: 600}
        }).setOrigin(0.5);

        const versionText = this.add.text(width - 15, height - 15, `Build: ${CONFIG.VERSION}`, {
            fontFamily: 'Tektur',
            fontSize: '12px',
            color: '#555555'
        }).setOrigin(1, 1);

        this.loadingUI.add([
            logo, loadingLabel, this.progressText, this.statusText,
            progressBarBg, this.progressBar,
            tipLabel, tipText,
            versionText
        ]);
    }

    createRetryUI(errorMessage) {
        if (this.loadingUI) {
            this.loadingUI.setVisible(false);
        }

        const {width, height} = this.sys.game.config;

        this.add.text(width / 2, height / 2 - 80, 'Connection Error', {
            fontFamily: 'Orbitron',
            fontSize: '28px',
            color: '#ff4d4d',
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 40, errorMessage, {
            fontFamily: 'Tektur',
            fontSize: '16px',
            color: '#cccccc',
            align: 'center',
            wordWrap: {width: width - 100}
        }).setOrigin(0.5);

        new TextButton(this, width / 2, height / 2 + 50, 'RETRY', () => {
            this.scene.restart();
        });
    }

    createWaitForPilotUI() {
        if (this.loadingUI) {
            this.loadingUI.setVisible(false);
        }
        const {width, height} = this.sys.game.config;
        this.add.text(width / 2, height / 2 - 80, 'Echo Synchronization', {
            fontFamily: 'Orbitron',
            fontSize: '28px',
            color: '#41C6FF',
        }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 - 30, 'Your new Echo is being registered on the network.\nPlease wait up to 1 minute and try again.', {
            fontFamily: 'Tektur',
            fontSize: '16px',
            color: '#cccccc',
            align: 'center',
            wordWrap: {width: width - 100}
        }).setOrigin(0.5);

        new TextButton(this, width / 2, height / 2 + 50, 'RETRY', () => {
            this.scene.restart();
        });
    }

    createMintPilotButton() {
        if (this.loadingUI) {
            this.loadingUI.setVisible(false);
        }
        const {width, height} = this.sys.game.config;

        const infoText = this.add.text(width / 2, height / 2 + 80, 'An Echo is required to enter the Hangar.', {
            fontFamily: 'Tektur',
            fontSize: '18px',
            color: '#b0bec5',
            align: 'center'
        }).setOrigin(0.5);

        new TextButton(this, width / 2, height / 2, 'Mint Your First Echo', () => {
            this.cleanUpConnectionScene();
            if (this.navigate) {
                console.log('Navigating to /mint-echo');
                this.navigate('/mint-echo');
            } else {
                console.error('Navigate function is not available!');
                infoText.setText('Navigation error. Please reload the page.');
            }
        });
    }

    updateProgress(progress, status) {
        if (this.progressBar) {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x41C6FF, 1);
            this.progressBar.fillRoundedRect(this.sys.game.config.width / 2 - 150, this.sys.game.config.height / 2 + 120, 300 * progress, 10, 5);
        }
        if (this.progressText) {
            this.progressText.setText(`${Math.round(progress * 100)}%`);
        }
        if (this.statusText) {
            this.statusText.setText(status);
        }
    }

    async loadInitialData() {
        try {

            this.updateProgress(0.1, 'Initializing secure connection...');

            await initializeWeb3.call(this);

            this.updateProgress(0.2, 'Verifying session...');
            const sessionResult = await checkSession(this);
            if (!sessionResult.isValid) {
                throw new Error(sessionResult.message || 'Failed to verify session');
            }

            this.updateProgress(0.3, 'Checking for Echoes...');
            await loadPilotsAndShips.call(this);

            if (!this.pilots || this.pilots.length === 0) {
                console.error('No Echoes found for this wallet. Stopping Hangar load.');
                this.updateProgress(1, 'Echo NFT required!');

                this.time.delayedCall(1000, () => {
                    this.createMintPilotButton();
                });
                return;
            }

            this.updateProgress(0.4, 'Synchronization...');
            const session = this.registry.get('session');

            await webSocketManager.connect(session.token, this.walletAddress);

            if (!webSocketManager.isWsIdentified) {
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error("Connection timeout waiting for identification")), 10000);

                    const onIdentified = () => {
                        clearTimeout(timeout);
                        webSocketManager.off('error', onError);
                        resolve();
                    };

                    const onError = (err) => {
                        clearTimeout(timeout);
                        webSocketManager.off('identified', onIdentified);
                        reject(err);
                    };

                    webSocketManager.once('identified', onIdentified);
                    webSocketManager.once('error', onError);
                });
            }

            this.updateProgress(0.5, 'Receiving Data...');
            const [
                shipsData,
                catalogData,
                inventoryData,
                factoriesData,
                inboxData,
                sentData,
                buffsData,
                expData
            ] = await Promise.all([
                webSocketManager.sendMessage('get-ships'),
                webSocketManager.sendMessage('get-catalog'),
                webSocketManager.sendMessage('get-inventory'),
                webSocketManager.sendMessage('get-factories'),
                webSocketManager.sendMessage('mails-get-list', {folder: 'inbox'}),
                webSocketManager.sendMessage('mails-get-list', {folder: 'sent'}),
                webSocketManager.sendMessage('get-active-buffs'),
                webSocketManager.sendMessage('get-actual-exp')
            ]);

            this.updateProgress(0.95, 'Entering...');

            this.updateProgress(1, 'Done!');

            const loadedData = {
                ...this.startData,
                walletAddress: this.walletAddress,
                provider: this.provider,
                signer: this.signer,
                pilotContract: this.pilotContract,
                shipNFTContract: this.shipNFTContract,
                shipManagerContract: this.shipManagerContract,
                tokenMinterContract: this.tokenMinterContract,
                osmsTokenContract: this.osmsTokenContract,
                pilots: this.pilots,
                ships: shipsData.allPlayerShips,
                inventoryItems: inventoryData.inventory,
                catalog: catalogData,
                craftFactories: factoriesData.factories,
                mailData: {
                    inbox: inboxData.data.mails,
                    sent: sentData.data.mails
                },
                activeBuffs: buffsData.buffs,
                actualExp: expData.exp
            };

            this.scene.start('HangarScene', loadedData);

        } catch (error) {
            console.error('HangarConnectionScene: A critical error occurred during loading:', error);

            if (error.message === 'NO_ECHO_ON_ACCOUNT') {
                this.updateProgress(1, 'Syncing...');
                this.time.delayedCall(500, () => {
                    this.createWaitForPilotUI();
                });
                return;
            }

            let userFriendlyMessage = error.message || 'An unknown error occurred.';
            if (error.code === 'CALL_EXCEPTION') {
                userFriendlyMessage = 'Can not load the data. RPC node not responding, change it or try again.';
            }

            this.updateProgress(1, `Error`);
            this.time.delayedCall(500, () => {
                this.createRetryUI(userFriendlyMessage);
            });
        }
    }
}