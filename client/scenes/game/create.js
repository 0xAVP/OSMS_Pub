import {createBackground, updateBackground} from './ui/background/background';
import {initExhaustTextures, initExhaustAnimations} from './objects/exhausts';
import {PoolManager} from './objects/PoolManager';
import {initPools} from './objects/poolSetup';
import {initHealthBarTexture} from './objects/enemies/healthBar';
import {initEnemyBulletPools, createPlayerBulletPools} from './objects/bulletManager';
import {initBulletAnimations} from './objects/bullets';
import {setupInput} from './controls/input';
import {Ship} from './objects/player/PlayerShipClass';
import {Player} from './objects/player/PlayerClass';
import {createStyledCountdown} from './ui/styledCountdown';
import {createHud} from './ui/hud';
import {createButtons} from './ui/buttons';
import {initAnimations} from './ui/animations';
import {Enemy} from './objects/enemies/Enemy';
import {BULLETS} from './objects/bullets';
import {soundManager} from '../shared/SoundManager.js';
import {CMT} from "../core/gameStateKeys";
import {encode} from "@msgpack/msgpack";
import {PowerUp} from './objects/powerups/PowerUp';
import {ModalManager} from './ui/endgame/ModalManager';

export function createScene() {
    const BASE_RESOLUTION = {width: 1920, height: 1080};
    const scaleFactor = Math.min(
        this.startWidth / BASE_RESOLUTION.width,
        this.startHeight / BASE_RESOLUTION.height
    );
    this.scaleValue = (value) => Math.max(1, Math.round(value * scaleFactor));
    this.isPlayerReady = false;
    this.lootNotificationQueue = [];
    this.isShowingLootNotification = false;
    this.lootBatchTimer = null;

    this.boundsCheckTimer = 0;
    this.lastPlayerCollisionTime = 0;
    this.backgroundLayers = createBackground(this);
    this.gameTime = 0;
    this.physicsOverlaps = [];
    this.activeBulletsMap = new Map();
    this.enemyBulletsBuffer = new Map();
    this.enemyBuffer = new Map();
    this.enemiesMap = new Map();
    this.unspawnedEnemiesData = new Map();
    this.unspawnedBulletsData = new Map();
    this.activePlayerBulletsMap = new Map();
    this.processedEnemyDestroyed = new Set();
    this.killCount = 0;
    this.lastUpdateTime = 0;
    this.lastCorrectionTime = 0;
    this.powerupsMap = new Map();

    initHealthBarTexture(this);

    const particleGraphics = this.make.graphics();
    particleGraphics.fillStyle(0xffffff, 1);
    particleGraphics.fillCircle(8, 8, 8);
    particleGraphics.generateTexture('circle_particle', 16, 16);
    particleGraphics.destroy();

    this.poolManager = new PoolManager(this);
    initPools(this);

    initEnemyBulletPools(this);
    initExhaustTextures(this);
    initExhaustAnimations(this);
    initBulletAnimations(this);
    setupInput(this);
    initAnimations(this);

    this.usedActions = [];

    this.physics.world.setBounds(0, 0, this.startWidth, this.startHeight);

    this.enemiesGroup = this.physics.add.group({
        classType: Enemy,
        maxSize: 200,
        runChildUpdate: true,
        createCallback: (enemy) => {
            enemy.init();
        }
    });

    this.powerupsGroup = this.physics.add.group({
        classType: PowerUp,
        runChildUpdate: false
    });

    this.modalManager = new ModalManager(this);
    this.hud = createHud(this);
    this.buttons = createButtons(this);

    try {
        this.styledCountdown = createStyledCountdown(this);
        if (!this.styledCountdown) console.error('Failed to create countdown text');
    } catch (error) {
        console.error(`Error initializing countdown: ${error.message}`);
    }
    this.isSceneReady = true;

    createPlayerBulletPools(this, this.shipConfig.weapon);
    this.playerShip = new Ship(this, this.initialPosition.x, this.initialPosition.y, this.shipConfig);
    console.log('Player ship spawned with config:', this.shipConfig);
    this.player = new Player(this, this.playerShip);
    console.log('Player object created.');

    if (!this.hudInitialized && this.hud) {
        const initialBaseState = {hp: this.initialBaseHp};
        this.hud.initialize(this.initialShipData, initialBaseState);
        this.hudInitialized = true;
        console.log('HUD initialized correctly after ship creation.');
    }

    soundManager.playMusic('game_music');

    const playerBulletTypes = Object.keys(BULLETS.player);
    const playerBulletGroups = playerBulletTypes.map(bulletKey => this.poolManager.pools.get(`player_bullet_${bulletKey}`));

    const overlap = this.physics.add.overlap(playerBulletGroups, this.enemiesGroup, (bullet, enemy) => {

        if (!bullet.active || !enemy.active) {
            return;
        }

        if (bullet.hitEnemies && bullet.hitEnemies.has(enemy.id)) {
            return;
        }

        if (bullet.originActionId === undefined || bullet.pelletIndex === undefined) {
            console.warn(`[CLIENT_HIT_OLD] Bullet ${bullet.id} missing originActionId/pelletIndex.`);
            enemy.takeHit(bullet);
            bullet.deactivate();
            this.activePlayerBulletsMap.delete(bullet.id);
            return;
        }

        bullet.hitEnemies.add(enemy.id);

        const hitClaimPayload = [
            bullet.originActionId,
            bullet.pelletIndex,
            enemy.id,
            Date.now() - (this.timeOffset || 0)
        ];

        try {
            const message = [CMT.HIT_CLAIM, hitClaimPayload];
            this.ws.send(encode(message));
        } catch (error) {
            console.error(`[CLIENT_HIT] Failed to send HIT_CLAIM:`, error);
        }

        console.log(`[CLIENT_HIT_CLAIM] Sent Hit Claim: actionId=${hitClaimPayload[0]}, enemyId=${hitClaimPayload[2]}`);
        enemy.takeHit(bullet);

        bullet.hitCount++;

        if (bullet.hitCount >= bullet.pierceLimit) {
            bullet.deactivate();
            this.activePlayerBulletsMap.delete(bullet.id);
        }

    }, null, this);
    this.physicsOverlaps.push(overlap);

    const playerEnemyOverlap = this.physics.add.overlap(this.playerShip.sprite, this.enemiesGroup, (playerSprite, enemy) => {
        const now = Date.now();
        const COLLISION_COOLDOWN = 1000;
        if (now - this.lastPlayerCollisionTime < COLLISION_COOLDOWN) return;
        this.lastPlayerCollisionTime = now;
        console.log(`Player collided with Enemy ID: ${enemy.id}.`);
        if (this.playerShip) this.playerShip.blinkShield();

        soundManager.playSfx('player_damaged1');

    }, null, this);
    this.physicsOverlaps.push(playerEnemyOverlap);

    const playerPowerupOverlap = this.physics.add.overlap(this.playerShip.sprite, this.powerupsGroup, (playerSprite, powerup) => {

    }, null, this);
    this.physicsOverlaps.push(playerPowerupOverlap);

    this.isPlayerReady = true;
    console.log('GameScene is now fully ready to process game states.');
}
