const CircularBuffer = require('../../utils/CircularBuffer');
const CONFIG = require('../../core/config');

function buildPlayerEntity(session, preparedShip, startHeight, calculatedHitboxRadius) {
    const em = session.entityManager;
    const cm = session.componentManager;

    const playerEntityId = em.createEntity();

    cm.addComponent(playerEntityId, 'player_controlled', {});
    cm.addComponent(playerEntityId, 'position', {x: 150, y: startHeight / 2});
    cm.addComponent(playerEntityId, 'velocity', {x: 0, y: 0});
    cm.addComponent(playerEntityId, 'position_history', new CircularBuffer(CONFIG.performance.HISTORY_BUFFER_CAPACITY));

    const shieldParams = preparedShip.modules.shield.module.params.shield;
    const armorParams = preparedShip.modules.armor.module.params.armor;
    cm.addComponent(playerEntityId, 'health', {
        hull: preparedShip.hull,
        maxHull: preparedShip.hull,
        armor: armorParams.capacity,
        maxArmor: armorParams.capacity,
        shield: shieldParams.capacity,
        maxShield: shieldParams.capacity,
        shieldRegen: shieldParams.regen,
        shieldRegenDelay: shieldParams.delay,
        lastHitTimestamp: 0
    });

    const energyParams = preparedShip.modules.engine.module.params.energy;
    cm.addComponent(playerEntityId, 'energy', {
        current: energyParams.capacity,
        capacity: energyParams.capacity,
        regen: energyParams.regen
    });

    cm.addComponent(playerEntityId, 'player_input', {lastProcessedActionId: -1, lastActionTime: Date.now()});
    cm.addComponent(playerEntityId, 'cooldowns', {lastFireTime: 0, lastWeaponSwitch: 0});
    cm.addComponent(playerEntityId, 'action_history', new Map());

    const weaponsData = {};
    for (const slotName of ['weapon1', 'weapon2']) {
        const weaponSlot = preparedShip.modules.weapons[slotName];
        if (weaponSlot && weaponSlot.module && weaponSlot.module.key) {
            weaponsData[slotName] = {
                key: weaponSlot.module.key,
                params: weaponSlot.module.params
            };
        }
    }
    cm.addComponent(playerEntityId, 'weapon_inventory', {
        activeSlot: 'weapon1',
        weapons: weaponsData,

    });

    const engineParams = preparedShip.modules.engine.module.params;
    cm.addComponent(playerEntityId, 'engine_stats', {
        speed: engineParams.speed,
        evasion: engineParams.evasion
    });

    cm.addComponent(playerEntityId, 'armor_stats', {
        absorption: preparedShip.modules.armor.module.params.absorption
    });

    cm.addComponent(playerEntityId, 'render', {
        size: preparedShip.shipSize,
        hitboxRadius: calculatedHitboxRadius
    });

    const geoComponent = session.componentPoolManager.acquire('collision_geometry');
    geoComponent.isCircle = true;
    geoComponent.radius = calculatedHitboxRadius;
    geoComponent.aabb.width = calculatedHitboxRadius * 2;
    geoComponent.aabb.height = calculatedHitboxRadius * 2;
    cm.addComponent(playerEntityId, 'collision_geometry', geoComponent);

    cm.addComponent(playerEntityId, 'active_buffs', new Map());
    const cachedStatsComponent = session.componentPoolManager.acquire('cached_stats');
    cm.addComponent(playerEntityId, 'cached_stats', cachedStatsComponent);
    cm.addComponent(playerEntityId, 'stats_dirty', {});

    return playerEntityId;
}

module.exports = {buildPlayerEntity};