import Phaser from 'phaser';
import {createScene} from './create';
import {handleInput} from './controls/input';
import {handleMessages} from './network/messageHandler';
import {checkExpiredBuffs} from '../shared/BuffService.js';
import {checkOutOfBoundsBullets, cleanUpGameScene} from './_CleanUp.js';
import {updateBackground} from './ui/background/background';
import {CONFIG} from "../core/config";
import {ENEMY_INTERPOLATION_CONFIG, interpolateEnemies, spawnEnemy} from "./state/enemySync";
import {BULLET_INTERPOLATION_CONFIG, interpolateEnemyBullets, spawnBullet} from "./state/bulletSync";
import {processUnspawnedObjects} from './state/SpawnManager';
import {TimeSynchronizer} from './network/timeSync';

import {encode} from '@msgpack/msgpack';
import {CMT} from "../core/gameStateKeys";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.accumulator = 0;
        this.FIXED_STEP_MS = CONFIG.gameplay.FIXED_STEP_MS;
        this.ws = null;
        this.map = 0;
        this.walletAddress = null;
        this.playerShip = null;
        this.shipConfig = null;
        this.ping = 0;
        this.pingInterval = null;
        this.overlay = null;
        this.loadingText = null;
        this.stageText = null;
        this.errorText = null;
        this.backButton = null;
        this.backButtonText = null;
        this.attemptCount = 1;
        this.startWidth = null;
        this.startHeight = null;
        this.isFullscreen = false;
        this.sessionId = null;
        this.initialPosition = {x: 0, y: 0};
        this.initialShipData = null;
        this.initialBaseHp = 0;

        this.reconnectToken = null;
        this.isReconnecting = false;
        this.forcedDisconnect = false;
        this.reconnectOverlay = null;
    }

    init(data) {

        this.forcedDisconnect = false;
        this.isReconnecting = false;
        this.gameState = 'preparation';
        this.lastServerActivity = Date.now();
        this.attemptCount = 1;

        this.ws = data.ws;
        this.shipTokenId = data.shipTokenId;
        this.pilotId = data.pilotId;
        this.map = data.map;
        this.walletAddress = data.walletAddress;
        this.isFullscreen = data.isFullscreen;
        this.startWidth = data.startWidth;
        this.startHeight = data.startHeight;

        this.sessionId = data.sessionId;
        this.initialPosition = data.initialPosition;
        this.initialShipData = data.playerShip;
        this.initialBaseHp = data.initialBaseHp;

        this.reconnectToken = data.reconnectToken;
        if (this.reconnectToken) {
            console.log('[GameScene] Reconnect token secured.');
        } else {
            console.warn('[GameScene] WARNING: No reconnect token provided!');
        }

        if (data.serverTime) {
            this.timeOffset = Date.now() - data.serverTime;
            console.log(`[GameScene] Time Offset initialized: ${this.timeOffset}ms`);
        } else {
            this.timeOffset = 0;
            console.warn('[GameScene] No serverTime received. Sync might be off.');
        }
    }

    create() {
        if (this.ws) {

            this.setupWebSocketHandlers(this.ws);
            console.log("GameScene has taken over the WebSocket connection.");

        } else {
            console.error("CRITICAL: GameScene started without a WebSocket connection.");
            this.returnToHangar();
            return;
        }
        this.lastServerActivity = Date.now();
        const weaponsConfig = {};
        if (this.initialShipData.modules.weapons.weapon1?.module) {
            weaponsConfig.weapon1 = this.initialShipData.modules.weapons.weapon1.module.params;
        }
        if (this.initialShipData.modules.weapons.weapon2?.module?.key) {
            weaponsConfig.weapon2 = this.initialShipData.modules.weapons.weapon2.module.params;
        }
        this.shipConfig = {
            name: this.initialShipData.type,
            engine: {speed: this.initialShipData.modules.engine.module.params.speed},
            weapon: weaponsConfig,
            shipSize: this.initialShipData.shipSize
        };

        this.physics.world.setBounds(0, 0, this.startWidth, this.startHeight);
        this.cameras.main.setBounds(0, 0, this.startWidth, this.startHeight);
        this.cameras.main.setZoom(1);

        createScene.call(this);
        this.timeSynchronizer = new TimeSynchronizer(this);
        this.timeSynchronizer.start();

        this.scale.on('resize', this.updateCameraViewport, this);
        this.scale.on('fullscreenchange', () => {
            console.log('Fullscreen state changed, isFullscreen:', this.scale.isFullscreen);
        });

        if (this.isFullscreen && !this.scale.isFullscreen) {
            this.scale.startFullscreen();
            console.log('Restored fullscreen mode in GameScene');
        }

        this.updateCameraViewport();
    }

    setupWebSocketHandlers(socket) {

        handleMessages(this);

        socket.onclose = (event) => {

            const isSmartReject = event.code === 4000;

            if (this.forcedDisconnect) {
                console.log('[GameScene] Disconnected properly (user exit).');
                return;
            }

            if (this.gameState === 'ended') {
                console.log('[GameScene] Session ended validly (Game Over). No reconnect.');
                return;
            }

            console.warn(`[GameScene] Socket closed (Code: ${event.code}). Initiating reconnect...`);
            this.handleReconnect(isSmartReject);
        };
    }

    handleReconnect(isImmediateRetry = false) {
        this.isReconnecting = true;
        this.showReconnectUI();
        this.lastServerActivity = Date.now();
        this.clearBattlefield();

        const delay = isImmediateRetry
            ? Math.floor(Math.random() * 400) + 100
            : 1000;

        console.log(`[GameScene] Reconnecting in ${delay}ms...`);

        this.time.delayedCall(delay, () => {
            if (this.scene.isActive('GameScene')) {
                this.connect();
            }
        });
    }

    clearBattlefield() {
        console.log('[GameScene] Clearing battlefield artifacts before reconnect...');

        if (this.activeBulletsMap) {
            this.activeBulletsMap.forEach((bullet) => {
                if (bullet.active) bullet.deactivate();
            });
            this.activeBulletsMap.clear();
        }

        if (this.enemyBulletsBuffer) this.enemyBulletsBuffer.clear();
        if (this.unspawnedBulletsData) this.unspawnedBulletsData.clear();

        if (this.enemiesMap) {
            this.enemiesMap.forEach((enemy) => {
                if (enemy.active) enemy.deactivate();
            });
            this.enemiesMap.clear();
        }

        if (this.enemyBuffer) this.enemyBuffer.clear();
        if (this.unspawnedEnemiesData) this.unspawnedEnemiesData.clear();

        if (this.powerupsMap) {
            this.powerupsMap.forEach((p) => {
                if (p.active) p.deactivate();
            });
            this.powerupsMap.clear();
        }

        if (this.activePlayerBulletsMap) {
            this.activePlayerBulletsMap.forEach((b) => {
                if (b.active) b.deactivate();
            });
            this.activePlayerBulletsMap.clear();
        }

    }

    connect() {
        console.log('[GameScene] Establishing new connection...');

        this.ws = new WebSocket(CONFIG.servers.game);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
            console.log('[GameScene] New WebSocket open. Sending RECONNECT_REQUEST...');
            this.lastServerActivity = Date.now();
            if (this.reconnectToken) {
                const msg = [
                    CMT.RECONNECT_REQUEST,
                    {
                        walletAddress: this.walletAddress,
                        reconnectToken: this.reconnectToken
                    }
                ];
                this.ws.send(encode(msg));
            } else {
                console.error('[GameScene] Missing reconnectToken!');
                this.returnToHangar();
            }
        };

        this.setupWebSocketHandlers(this.ws);
    }

    showReconnectUI() {
        if (this.reconnectOverlay) return;
        const {width, height} = this.scale;

        const bg = this.add.graphics().setDepth(2000).setScrollFactor(0);
        bg.fillStyle(0x000000, 0.7);
        bg.fillRect(0, 0, width, height);

        const text = this.add.text(width / 2, height / 2, 'CONNECTION LOST\nRECONNECTING...', {
            fontFamily: 'Orbitron', fontSize: '32px', color: '#FFD700', align: 'center'
        }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);

        this.reconnectOverlay = this.add.container(0, 0, [bg, text]);
    }

    hideReconnectUI() {
        if (this.reconnectOverlay) {
            this.reconnectOverlay.destroy();
            this.reconnectOverlay = null;
        }
        this.isReconnecting = false;
    }

    updateCameraViewport() {
        if (!this.cameras || !this.cameras.main) {
            console.log('Camera is undefined, skipping viewport update');
            return;
        }

        const windowWidth = this.scale.width;
        const windowHeight = this.scale.height;
        const offsetX = (windowWidth - this.startWidth) / 2;
        const offsetY = (windowHeight - this.startHeight) / 2;

        this.cameras.main.setViewport(
            Math.max(0, offsetX),
            Math.max(0, offsetY),
            Math.min(this.startWidth, windowWidth),
            Math.min(this.startHeight, windowHeight)
        );
    }

    update(time, delta) {

        if (this.isReconnecting) return;

        if (this.gameState !== 'ended' && this.gameState !== 'exiting') {
            if (Date.now() - (this.lastServerActivity || Date.now()) > CONFIG.gameplay.SERVER_WATCHDOG) {
                console.warn('[GameScene] Watchdog: Server silent. Forcing reconnect.');
                this.lastServerActivity = Date.now();
                if (this.ws) this.ws.close();
                return;
            }
        }

        if (this.gameState === 'active') {
            this.gameTime += delta / 1000;
        }

        this.accumulator += delta;
        while (this.accumulator >= this.FIXED_STEP_MS) {
            const fixedDeltaSec = this.FIXED_STEP_MS / 1000;
            handleInput(this, fixedDeltaSec);
            if (this.player) this.player.update(fixedDeltaSec);
            checkOutOfBoundsBullets(this);
            checkExpiredBuffs(this);
            this.accumulator -= this.FIXED_STEP_MS;
        }

        processUnspawnedObjects(this, this.unspawnedEnemiesData, this.enemyBuffer, ENEMY_INTERPOLATION_CONFIG, spawnEnemy);
        processUnspawnedObjects(this, this.unspawnedBulletsData, this.enemyBulletsBuffer, BULLET_INTERPOLATION_CONFIG, spawnBullet);

        interpolateEnemies(this);
        interpolateEnemyBullets(this);

        if (this.playerShip) {
            this.playerShip.update(delta / 1000);
        }

        updateBackground(this, delta);
    }

    returnToHangar() {
        this.forcedDisconnect = true;

        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
        }

        const scene = this;
        scene.events.once('shutdown', () => {
            cleanUpGameScene.call(this);
            scene.scene.manager.start('HangarConnectionScene', {
                walletAddress: scene.walletAddress,
                selectedShipId: scene.shipTokenId,
                selectedPilotId: scene.pilotId
            });
        });
        scene.scene.stop();
    }
}
