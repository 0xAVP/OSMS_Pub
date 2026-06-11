import {GSK, GET, EPK, MK, MT, CMT, PWRSK} from '../../core/gameStateKeys';
import {encode, decode} from '@msgpack/msgpack';
import {handleServerState} from '../state/sync';
import {handleLootDrop} from '../objects/loot/lootHandler';
import {showNotification} from '../ui/notification';
import {processEnemyDestroyed, createPlayerShipExplosion, createBaseExplosion, handleBulletHit} from './hitHandler';
import {createFloatingText} from '../ui/floatingText.js';
import LootIdManager from '../objects/loot/lootIdManager';
import {POWERUP_TYPES} from "../objects/powerups/powerupTypes";
import {ModalManager} from "../ui/endgame/ModalManager";

function processGameEvents(scene, events) {
    if (!events || !Array.isArray(events)) return;

    events.forEach(eventArray => {
        if (!Array.isArray(eventArray)) return;
        const type = eventArray[0];
        const payload = eventArray[1] || {};
        switch (type) {

            case GET.ENEMY_DESTROYED: {

                const newKillCount = payload[EPK.NEW_KILL_COUNT];

                processEnemyDestroyed(scene, payload);

                if (newKillCount !== undefined && scene.hud && scene.hud.killCountText) {
                    const formattedKills = String(newKillCount).padStart(4, '0');
                    scene.hud.killCountText.setText(formattedKills);
                }
                break;
            }
            case GET.RESOURCE_MINED:
                const enemyId = payload[EPK.ENEMY_ID];
                const loot = payload[EPK.LOOT];
                const enemy = scene.enemiesMap.get(enemyId);
                if (enemy) {
                    enemy.playMiningEffect();
                    handleLootDrop(scene, loot, enemy.x, enemy.y);
                }
                break;
            case GET.BULLET_COLLIDED: {
                handleBulletHit(scene, payload[EPK.BULLET_ID]);
                break;
            }
            case GET.ENEMY_DAMAGED: {
                const enemyId = payload[EPK.ENEMY_ID];
                const newHp = payload[EPK.NEW_ENEMY_HP];
                const damage = payload[EPK.DAMAGE_AMOUNT];
                const enemy = scene.enemiesMap.get(enemyId);

                if (enemy) {

                    if (newHp !== undefined) {
                        enemy.hp = newHp;
                    }

                    if (damage !== undefined) {
                        const roundedDamage = Math.floor(damage);

                        if (payload[EPK.IS_CRITICAL] !== undefined) {

                            enemy.playCriticalHitEffect();
                            createFloatingText(scene, enemy.x, enemy.y, `CRIT! ${roundedDamage}`, 'red');
                        } else {

                            createFloatingText(scene, enemy.x, enemy.y, `${roundedDamage}`, 'white', 16);
                        }
                    }

                }
                break;
            }
            case GET.ENEMY_COLLISION_DESTROYED: {
                const enemyId = payload[EPK.ENEMY_ID];
                const enemy = scene.enemiesMap.get(enemyId);

                if (enemy) {

                    enemy.hp = 0;
                    createFloatingText(scene, enemy.x, enemy.y, 'RAM KILL', 'orange');
                }
                break;
            }
            case GET.PLAYER_EVADE_FEEDBACK:
                if (scene.playerShip) {
                    scene.playerShip.playEvasionEffect();
                }
                break;
            case GET.PLAYER_ABSORB_FEEDBACK: {
                const absorbedAmount = payload[EPK.ABSORBED_AMOUNT];
                if (scene.playerShip && absorbedAmount > 0) {
                    scene.playerShip.playAbsorptionEffect(absorbedAmount);
                }
                break;
            }
            case GET.BASE_DAMAGED: {
                const enemyId = payload[EPK.ENEMY_ID];
                const newHp = payload[EPK.NEW_BASE_HP];

                scene.events.emit('baseDamaged', enemyId);

                if (scene.hud && newHp !== undefined) {
                    scene.hud.baseHpBar.update(newHp, scene.hud.baseMaxHp);
                }
                break;
            }
            case GET.POWERUP_ACQUIRED: {

                const powerupId = payload[PWRSK.ID];
                const powerupTypeId = String(payload[PWRSK.TYPE_ID]);
                const powerupSprite = scene.powerupsMap ? scene.powerupsMap.get(powerupId) : null;

                const feedback = POWERUP_TYPES[powerupTypeId]?.feedback || POWERUP_TYPES.default.feedback;

                const spawnX = powerupSprite ? powerupSprite.x : (scene.playerShip?.sprite?.x || 0);
                const spawnY = powerupSprite ? powerupSprite.y : (scene.playerShip?.sprite?.y - 40 || 0);

                createFloatingText(scene, spawnX, spawnY, feedback.text, feedback.color, 24);

                if (scene.playerShip?.sprite) {
                    scene.tweens.add({
                        targets: scene.playerShip.sprite,
                        tint: feedback.tint,
                        duration: 150,
                        yoyo: true,
                        onComplete: () => {
                            if (scene.playerShip.sprite) {
                                scene.playerShip.sprite.clearTint();
                            }
                        }
                    });

                    scene.playerShip.playPowerUpEffect(feedback.tint);

                }

                break;
            }

            default:

                console.warn(`Unhandled event type in game-state: ${event.type}`);
                break;
        }
    });
}

/**
 * Основная логика обработки всех входящих сообщений после их декодирования.
 * @param {Phaser.Scene} scene - Текущая игровая сцена.
 * @param {object | object[]} data - Декодированное сообщение (одиночный объект или массив).
 */
export function processDecodedMessage(scene, data) {
    if (!scene.isSceneReady) {
        console.warn("Scene is not ready, discarding message.");
        return;
    }
    scene.lastServerActivity = Date.now();

    const type = data[MK.TYPE];
    const payload = data[MK.PAYLOAD];
    const serverTimestamp = data[MK.TIMESTAMP];

    switch (type) {
        case MT.GAME_STATE: {
            if (scene.isReconnecting) {
                console.log('[MessageHandler] GAME_STATE received. Reconnect SUCCESS.');
                scene.hideReconnectUI();
                if (scene.timeSynchronizer) scene.timeSynchronizer.start();
            }
            if (payload) {
                processGameEvents(scene, payload[GSK.GAME_EVENTS]);
                handleServerState.call(scene, payload, serverTimestamp);
            } else {
                console.error('Invalid server state:', payload);
            }
            break;
        }

        case MT.RECONNECT_FAILED: {
            console.warn('[MessageHandler] Reconnect Failed:', payload);

            if (payload && payload.retry === true) {
                console.log('[MessageHandler] Smart Reject. Retrying immediately.');

                if (scene.ws) scene.ws.close(4000);
            } else {
                console.error('[MessageHandler] Fatal reconnect error.');
                scene.returnToHangar();
            }
            break;
        }

        case MT.TIME_SYNC_RESPONSE: {
            if (scene.timeSynchronizer) {
                scene.timeSynchronizer.handleResponse(payload);
            }
            break;
        }

        case MT.COUNTDOWN: {
            try {
                const {isPreparation, gameTime} = payload;

                if (isPreparation && gameTime > 0) {
                    if (scene.gameState === 'preparation') {

                        if (scene.styledCountdown && !scene.styledCountdown.container.visible) {
                            scene.styledCountdown.start(gameTime);
                        } else if (scene.styledCountdown) {

                            scene.styledCountdown.updateNumber(gameTime);
                        }
                    }
                } else if (!isPreparation) {

                    if (scene.gameState === 'preparation') {
                        scene.gameTime = 0;
                        scene.gameState = 'active';
                        if (scene.styledCountdown) {
                            scene.styledCountdown.hide();
                        }
                        if (scene.hud && scene.hud.playIntroAnimation) {
                            scene.hud.playIntroAnimation();
                        }
                    }
                }
            } catch (error) {
                console.error(`Error handling countdown message: ${error.message}`);
            }
            break;
        }

        case MT.WAVE: {
            try {

                if (scene.modalManager && scene.modalManager.activeModal) {
                    scene.modalManager.dismissActiveModal();
                }

                scene.gameState = 'active';

                const {waveNumber, stageNumber} = payload || {};
                if (!Number.isFinite(waveNumber) || waveNumber < 1 || !Number.isFinite(stageNumber) || stageNumber < 1) {
                    throw new Error(`Invalid wave data: waveNumber=${waveNumber}, stageNumber=${stageNumber}`);
                }
                showNotification(scene, `Stage: ${stageNumber} Wave: ${waveNumber}`);

            } catch (error) {
                console.error(`Error handling wave message: ${error.message}`);
            }
            break;
        }

        case MT.LAST_WAVE_CONTINUING: {
            try {
                const {remainingEnemies} = payload || {};
                if (!Number.isFinite(remainingEnemies) || remainingEnemies < 0) {
                    throw new Error(`Invalid last-wave-continuing data: remainingEnemies=${remainingEnemies}`);
                }
                const message = `Boss Wave Starting. Remaining enemies ${remainingEnemies}`;
                showNotification(scene, message, true);
                break;
            } catch (error) {
                console.error(`Error handling last-wave-continuing message: ${error.message}`);
            }
            break;
        }

        case MT.BOSS_SPAWNED: {
            try {
                const {stageNumber} = payload || {};
                if (!Number.isFinite(stageNumber) || stageNumber < 0) {
                    throw new Error(`Invalid boss-spawned data: stageNumber=${stageNumber}`);
                }
                showNotification(scene, `Boss spawned for stage: ${stageNumber}`);
            } catch (error) {
                console.error(`Error handling boss-spawned message: ${error.message}`);
            }
            break;
        }

        case MT.POST_BOSS_DELAY: {
            try {
                scene.gameState = 'paused';
                console.log("Game state changed to: paused");
                scene.events.emit('stageCleared');

                const {remainingTime} = payload || {};
                if (!Number.isFinite(remainingTime) || remainingTime < 0) {
                    throw new Error(`Invalid post-boss-delay data: remainingTime=${remainingTime}`);
                }

                if (!scene.modalManager) {
                    scene.modalManager = new ModalManager(scene);
                }
                scene.modalManager.showPostBossModal(remainingTime);

            } catch (error) {
                console.error(`Error handling post-boss-delay message: ${error.message}`);
            }
            break;
        }

        case MT.PING: {

            if (scene.ws && scene.ws.readyState === WebSocket.OPEN) {

                scene.ws.send(encode([CMT.PONG]));
            }

            const serverPing = payload?.ping;
            if (typeof serverPing === 'number') {
                scene.ping = serverPing;
                if (scene.hud && scene.hud.pingText) {
                    scene.hud.pingText.setText(`Ping: ${Math.round(scene.ping)} ms`);
                }
            }
            break;
        }

        case MT.ERROR: {
            console.error('FATAL SERVER ERROR:', payload);
            scene.gameState = 'ended';
            if (scene.modalManager) {
                scene.modalManager.showDefeatModal('serverError', {});
            }

            if (scene.ws) scene.ws.close();
            break;
        }

        case MT.POSITION_REJECTED: {
            const {serverX, serverY, clientX, clientY, reason} = payload;
            console.warn(`Position rejected by server: ${reason}, Server: (${serverX}, ${serverY}), Client: (${clientX}, ${clientY})`);
            if (scene.playerShip && scene.playerShip.sprite) {
                scene.tweens.add({
                    targets: scene.playerShip.sprite,
                    x: serverX,
                    y: serverY,
                    duration: 200,
                    ease: 'Linear',
                    onComplete: () => console.warn(`Position corrected to (${serverX}, ${serverY})`)
                });
            }
            break;
        }

        case MT.FIRE_REJECTED: {
            console.warn(`Fire rejected: ${payload.reason}`);
            break;
        }

        case MT.END_GAME: {
            scene.gameState = 'ended';
            console.log("Game state changed to: ended");
            const {reason, loot, sessionStats} = payload || {reason: 'unknown', loot: {}, sessionStats: {killCount: 0}};
            console.log(`Game ended: reason=${reason}`);

            if (reason === 'playerLoose') createPlayerShipExplosion(scene);
            if (reason === 'baseBroken') createBaseExplosion(scene);

            if (scene.keys) {
                scene.input.keyboard.resetKeys();
                scene.input.keyboard.removeKey('W');
                scene.input.keyboard.removeKey('S');
                scene.input.keyboard.removeKey('A');
                scene.input.keyboard.removeKey('D');
                scene.input.keyboard.removeKey('SPACE');
                console.log('Movement and firing keys disabled');
            }
            if (scene.playerShip && scene.playerShip.sprite && scene.playerShip.sprite.body) {
                scene.playerShip.sprite.body.setVelocity(0, 0);
            }

            if (reason === 'playerWin') {
                scene.modalManager.showVictoryModal(loot);
            } else {
                scene.modalManager.showDefeatModal(reason, sessionStats);
            }

            if (scene.ws && scene.ws.readyState === WebSocket.OPEN) {
                scene.ws.close();
                console.log('WebSocket connection closed on end-game');
            }
            break;
        }

        default: {
            console.warn(`Unhandled message type: ${data.type}`);
            break;
        }
    }
}

/**
 * Устанавливает обработчик входящих сообщений WebSocket для игровой сцены.
 * Умеет обрабатывать как текстовые JSON-сообщения, так и бинарные MessagePack.
 * @param {Phaser.Scene} scene - Текущая игровая сцена.
 */
export function handleMessages(scene) {
    scene.hudInitialized = false;

    scene.ws.onmessage = (event) => {
        if (!(event.data instanceof Blob) && !(event.data instanceof ArrayBuffer)) {
            console.warn('Received non-binary WebSocket message, which is not expected. Ignoring.', typeof event.data);
            return;
        }

        const bufferPromise = (event.data instanceof Blob)
            ? event.data.arrayBuffer()
            : Promise.resolve(event.data);

        bufferPromise.then(buffer => {
            try {
                const decodedData = decode(buffer);

                if (scene && scene.scene.isActive()) {
                    processDecodedMessage(scene, decodedData);
                }

            } catch (e) {
                console.error('Failed to decode MessagePack message:', e);
            }
        }).catch(err => console.error("Error processing binary message:", err));
    };
}