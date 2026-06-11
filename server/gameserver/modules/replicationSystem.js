const WebSocket = require('ws');
const CONFIG = require('../core/config');
const {GSK, PSK, ESK, BSK, MK, MT, PWRSK} = require('../core/gameStateKeys');
const {safeSend} = require("../utils/networkUtils");

class ReplicationSystem {
    constructor() {
        this._scratchStateObject = {};

        this._finalPayload = {
            [GSK.PLAYER]: {
                [PSK.LAST_PROCESSED_ACTION_ID]: -1,
                [PSK.SHIELD]: 0,
                [PSK.ARMOR]: 0,
                [PSK.HULL]: 0,
                [PSK.ENERGY]: 0,
                [PSK.ACTIVE_WEAPON_SLOT]: '',
            },
            [GSK.GAME_EVENTS]: [],
            [GSK.NEW_ENEMIES]: [],
            [GSK.UPDATED_ENEMIES]: [],
            [GSK.DESTROYED_ENEMIES]: [],
            [GSK.NEW_BULLETS]: [],
            [GSK.UPDATED_BULLETS]: [],
            [GSK.DESTROYED_BULLETS]: [],
            [GSK.NEW_POWERUPS]: [],
            [GSK.DESTROYED_POWERUPS]: [],
        };
    }

    /**
     * ОПТИМИЗАЦИЯ GC: Быстрая очистка массивов в payload перед каждым использованием.
     */
    _resetPayloadArrays() {
        this._finalPayload[GSK.GAME_EVENTS].length = 0;
        this._finalPayload[GSK.NEW_ENEMIES].length = 0;
        this._finalPayload[GSK.UPDATED_ENEMIES].length = 0;
        this._finalPayload[GSK.DESTROYED_ENEMIES].length = 0;
        this._finalPayload[GSK.NEW_BULLETS].length = 0;
        this._finalPayload[GSK.UPDATED_BULLETS].length = 0;
        this._finalPayload[GSK.DESTROYED_BULLETS].length = 0;
        this._finalPayload[GSK.NEW_POWERUPS].length = 0;
        this._finalPayload[GSK.DESTROYED_POWERUPS].length = 0;
    }

    generateAndSendState(session) {
        if (session.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        this._resetPayloadArrays();
        const payload = this._finalPayload;
        const cm = session.componentManager;

        this._gatherPlayerState(session, cm, payload[GSK.PLAYER]);

        this._processEntities(session, cm, payload);

        const gameEvents = session.gameEvents;
        if (gameEvents.length > 0) {
            const payloadEvents = payload[GSK.GAME_EVENTS];
            for (let i = 0; i < gameEvents.length; i++) {
                payloadEvents.push(gameEvents[i]);
            }
        }

        const stateMessage = {
            [MK.TYPE]: MT.GAME_STATE,
            [MK.PAYLOAD]: payload,
            [MK.TIMESTAMP]: Date.now()
        };

        safeSend(session.ws, stateMessage);

        session.gameEvents.length = 0;
    }

    _gatherPlayerState(session, cm, playerPayload) {
        const {playerEntityId} = session;

        const playerInput = cm.getComponent(playerEntityId, 'player_input');
        const playerHealth = cm.getComponent(playerEntityId, 'health');
        const playerEnergy = cm.getComponent(playerEntityId, 'energy');
        const playerInventory = cm.getComponent(playerEntityId, 'weapon_inventory');

        playerPayload[PSK.LAST_PROCESSED_ACTION_ID] = playerInput ? playerInput.lastProcessedActionId : -1;
        playerPayload[PSK.SHIELD] = playerHealth ? Math.round(playerHealth.shield) : 0;
        playerPayload[PSK.ARMOR] = playerHealth ? Math.round(playerHealth.armor) : 0;
        playerPayload[PSK.HULL] = playerHealth ? Math.round(playerHealth.hull) : 0;
        playerPayload[PSK.ENERGY] = playerEnergy ? Math.round(playerEnergy.current) : 0;
        playerPayload[PSK.ACTIVE_WEAPON_SLOT] = playerInventory ? playerInventory.activeSlot : 'weapon1';
    }

    _processEntities(session, cm, payload) {
        const {activeEntities, replication} = session;
        const deltaCompressor = replication.deltaCompressor;

        const isFullUpdateTick = (session.enemyStateTickCounter = (session.enemyStateTickCounter || 0) + 1) >= CONFIG.server.ENEMY_UPDATE_FREQUENCY_TICKS;
        if (isFullUpdateTick) {
            session.enemyStateTickCounter = 0;
        }

        this._compareEntitySets(
            activeEntities.enemies,
            replication.knownEnemyIds,
            payload[GSK.NEW_ENEMIES],
            isFullUpdateTick ? payload[GSK.UPDATED_ENEMIES] : null,
            payload[GSK.DESTROYED_ENEMIES],
            cm,
            this._serializeEnemy,
            deltaCompressor,
            ESK.ID
        );

        this._compareEntitySets(
            activeEntities.enemyBullets,
            replication.knownBulletIds,
            payload[GSK.NEW_BULLETS],
            isFullUpdateTick ? payload[GSK.UPDATED_BULLETS] : null,
            payload[GSK.DESTROYED_BULLETS],
            cm,
            this._serializeBullet,
            deltaCompressor,
            BSK.ID
        );

        this._compareEntitySets(
            activeEntities.powerUps,
            replication.knownPowerUpIds,
            payload[GSK.NEW_POWERUPS],
            null,
            payload[GSK.DESTROYED_POWERUPS],
            cm,
            this._serializePowerUp,
            deltaCompressor,
            PWRSK.ID
        );
    }

    _compareEntitySets(currentIds, knownIds, newEntitiesArray, updatedEntitiesArray, destroyedIdsArray, cm, serializer, deltaCompressor, idKey) {

        for (const entityId of currentIds) {
            if (knownIds.has(entityId)) {

                if (updatedEntitiesArray) {

                    const success = serializer.call(this, entityId, cm, this._scratchStateObject);
                    if (success) {
                        const delta = deltaCompressor.compress(entityId, this._scratchStateObject);
                        if (delta) {
                            delta[idKey] = entityId;
                            updatedEntitiesArray.push(delta);
                        }
                    }
                }
            } else {

                const success = serializer.call(this, entityId, cm, this._scratchStateObject);
                if (success) {

                    const fullState = {...this._scratchStateObject};

                    newEntitiesArray.push(fullState);
                    deltaCompressor.addEntity(entityId, fullState);
                    knownIds.add(entityId);
                }
            }
        }

        const idsToDeleteFromKnown = [];
        for (const oldId of knownIds) {
            if (!currentIds.has(oldId)) {

                destroyedIdsArray.push(oldId);
                deltaCompressor.removeEntity(oldId);
                idsToDeleteFromKnown.push(oldId);
            }
        }

        if (idsToDeleteFromKnown.length > 0) {
            for (const idToDelete of idsToDeleteFromKnown) {
                knownIds.delete(idToDelete);
            }
        }
    }

    _serializeEnemy(entityId, cm, targetObject) {
        const position = cm.getComponent(entityId, 'position');
        if (!position) return false;

        const render = cm.getComponent(entityId, 'render');
        const stats = cm.getComponent(entityId, 'stats');
        const velocity = cm.getComponent(entityId, 'velocity');
        if (!render || !stats || !velocity) return false;

        targetObject[ESK.ID] = entityId;
        targetObject[ESK.TYPE_ID] = render.typeId;
        targetObject[ESK.POSITION] = [Math.round(position.x * 10), Math.round(position.y * 10)];
        targetObject[ESK.VELOCITY] = [Math.round(velocity.x * 10), Math.round(velocity.y * 10)];
        targetObject[ESK.HP] = Math.round(stats.hp);
        targetObject[ESK.SIZE] = [render.size.width, render.size.height];
        targetObject[ESK.COLLISION_DAMAGE] = stats.collisionDamage;

        if (position.rotation !== undefined) {
            targetObject[ESK.ROTATION] = Math.round(position.rotation * 100);
        } else {
            delete targetObject[ESK.ROTATION];
        }

        return true;
    }

    _serializeBullet(entityId, cm, targetObject) {
        const position = cm.getComponent(entityId, 'position');
        if (!position) return false;

        const velocity = cm.getComponent(entityId, 'velocity');
        const render = cm.getComponent(entityId, 'render');
        if (!velocity || !render) return false;

        targetObject[BSK.ID] = entityId;
        targetObject[BSK.TYPE] = render.typeId;
        targetObject[BSK.SIZE] = [render.size.width, render.size.height];
        targetObject[BSK.POSITION] = [Math.round(position.x * 10), Math.round(position.y * 10)];
        targetObject[BSK.VELOCITY] = [Math.round(velocity.x * 10), Math.round(velocity.y * 10)];

        return true;
    }

    _serializePowerUp(entityId, cm, targetObject) {
        const position = cm.getComponent(entityId, 'position');
        if (!position) return false;

        const render = cm.getComponent(entityId, 'render');
        if (!render) return false;

        targetObject[PWRSK.ID] = entityId;
        targetObject[PWRSK.TYPE_ID] = render.typeId;
        targetObject[PWRSK.POSITION] = [Math.round(position.x), Math.round(position.y)];
        targetObject[PWRSK.SIZE] = [render.size.width, render.size.height];

        return true;
    }
}

module.exports = new ReplicationSystem();