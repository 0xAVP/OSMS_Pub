/**
 *
 * Собирает сущность врага, заполняя компоненты из пула вычисленными данными.
 * @param {object} cm - ComponentManager.
 * @param {number} entityId - ID создаваемой сущности.
 * @param {string} entityTypeId - Тип врага (e.g., "1", "1001").
 * @param {object} staticData - Ссылка на НЕИЗМЕНЯЕМЫЙ статический конфиг врага.
 * @param {object} finalStats - Объект с вычисленными характеристиками (hp, speed, weapons etc.).
 * @param {object} entitySize - Финальный размер текстуры { width, height }.
 * @param {object} position - Начальная позиция { x, y }.
 * @param {number} now - Текущая временная метка.
 * @param {object} session - Игровая сессия.
 */
function addEnemyComponents(cm, entityId, entityTypeId, staticData, finalStats, entitySize, position, now, session) {
    const poolManager = session.componentPoolManager;

    cm.addComponent(entityId, 'enemy', {});
    if (staticData.isIndestructible) cm.addComponent(entityId, 'indestructible', {});
    if (staticData.dealsOneShotDamage) cm.addComponent(entityId, 'oneshot', {});

    const posComponent = poolManager.acquire('position');
    posComponent.x = position.x;
    posComponent.y = position.y;
    posComponent.rotation = undefined;
    cm.addComponent(entityId, 'position', posComponent);

    const velComponent = poolManager.acquire('velocity');

    velComponent.x = 0;
    velComponent.y = 0;
    cm.addComponent(entityId, 'velocity', velComponent);

    const historyComponent = poolManager.acquire('position_history');
    cm.addComponent(entityId, 'position_history', historyComponent);

    const statsComponent = poolManager.acquire('stats');
    statsComponent.hp = finalStats.hp;
    statsComponent.maxHp = finalStats.hp;
    statsComponent.collisionDamage = finalStats.collisionDamage;
    cm.addComponent(entityId, 'stats', statsComponent);

    const renderComponent = poolManager.acquire('render');
    renderComponent.typeId = entityTypeId;
    renderComponent.size = entitySize;
    renderComponent.name = staticData.name;
    cm.addComponent(entityId, 'render', renderComponent);

    const weaponStateComponent = poolManager.acquire('weaponState');
    const primaryWeapon = finalStats.weapons && finalStats.weapons.length > 0 ? finalStats.weapons[0].weapon : {};
    weaponStateComponent.weapons = finalStats.weapons;
    weaponStateComponent.lastWeaponChange = now;
    weaponStateComponent.fireRate = primaryWeapon.fireRate || 0;
    weaponStateComponent.bulletType = primaryWeapon.bulletType || '';
    weaponStateComponent.bulletSize = primaryWeapon.bulletSize || {width: 0, height: 0};
    weaponStateComponent.bulletLifetimeMs = primaryWeapon.bulletLifetimeMs || null;
    weaponStateComponent.bulletDamage = primaryWeapon.bulletDamage || 0;
    cm.addComponent(entityId, 'weaponState', weaponStateComponent);

    const statusEffectsComponent = poolManager.acquire('statusEffects');
    statusEffectsComponent.spawnTimestamp = now;
    cm.addComponent(entityId, 'statusEffects', statusEffectsComponent);

    const behaviorComponent = poolManager.acquire('behavior');
    behaviorComponent.script = staticData.behavior.script;
    behaviorComponent.boundaryBehavior = staticData.behavior.boundaryBehavior;
    behaviorComponent.baseSpeed = finalStats.speed;
    cm.addComponent(entityId, 'behavior', behaviorComponent);

    const geoComponent = poolManager.acquire('collision_geometry');
    geoComponent.isCircle = false;
    geoComponent.width = entitySize.width;
    geoComponent.height = entitySize.height;
    geoComponent.aabb.width = entitySize.width;
    geoComponent.aabb.height = entitySize.height;
    geoComponent.aabb.x = position.x - entitySize.width / 2;
    geoComponent.aabb.y = position.y - entitySize.height / 2;
    cm.addComponent(entityId, 'collision_geometry', geoComponent);
}

/**
 * Добавляет компоненты, необходимые для вражеской пули, к указанной сущности.
 * ВАЖНОЕ ИЗМЕНЕНИЕ: Функция теперь принимает 'session' для доступа к пулам.
 * @param {object} cm - ComponentManager сессии.
 * @param {number} entityId - ID сущности.
 * @param {object} startPosition - Позиция, из которой выпущена пуля.
 * @param {object} initialVelocity - Начальный вектор скорости пули.
 * @param {object} weaponState - Текущее состояние оружия врага.
 * @param {object} session - Игровая сессия.
 */
function addEnemyBulletComponents(cm, entityId, startPosition, initialVelocity, weaponState, session) {
    const poolManager = session.componentPoolManager;

    const posComponent = poolManager.acquire('position');
    posComponent.x = startPosition.x;
    posComponent.y = startPosition.y;
    cm.addComponent(entityId, 'position', posComponent);

    const velComponent = poolManager.acquire('velocity');
    velComponent.x = initialVelocity.x;
    velComponent.y = initialVelocity.y;
    cm.addComponent(entityId, 'velocity', velComponent);

    const historyComponent = poolManager.acquire('position_history');
    cm.addComponent(entityId, 'position_history', historyComponent);

    const renderComponent = poolManager.acquire('render');
    renderComponent.typeId = weaponState.bulletType;
    renderComponent.size = weaponState.bulletSize;
    cm.addComponent(entityId, 'render', renderComponent);

    const projectileComponent = poolManager.acquire('projectile');
    projectileComponent.damage = weaponState.bulletDamage;
    cm.addComponent(entityId, 'projectile', projectileComponent);

    if (weaponState.bulletLifetimeMs > 0) {
        const lifetimeComponent = poolManager.acquire('lifetime');
        lifetimeComponent.expiresAt = Date.now() + weaponState.bulletLifetimeMs;
        cm.addComponent(entityId, 'lifetime', lifetimeComponent);
    }

    const geoComponent = poolManager.acquire('collision_geometry');
    const bulletSize = weaponState.bulletSize;
    geoComponent.isCircle = false;
    geoComponent.width = bulletSize.width;
    geoComponent.height = bulletSize.height;
    geoComponent.aabb.width = bulletSize.width;
    geoComponent.aabb.height = bulletSize.height;
    geoComponent.aabb.x = startPosition.x - bulletSize.width / 2;
    geoComponent.aabb.y = startPosition.y - bulletSize.height / 2;
    cm.addComponent(entityId, 'collision_geometry', geoComponent);
}

function addPowerUpComponents(cm, entityId, powerUpConfig, startPosition, session) {
    const poolManager = session.componentPoolManager;

    const posComponent = poolManager.acquire('position');
    posComponent.x = startPosition.x;
    posComponent.y = startPosition.y;
    cm.addComponent(entityId, 'position', posComponent);

    const velComponent = poolManager.acquire('velocity');
    velComponent.x = 0;
    velComponent.y = 0;
    cm.addComponent(entityId, 'velocity', velComponent);

    const historyComponent = poolManager.acquire('position_history');
    cm.addComponent(entityId, 'position_history', historyComponent);

    const renderComponent = poolManager.acquire('render');
    renderComponent.typeId = powerUpConfig.typeId;
    renderComponent.size = powerUpConfig.size;
    cm.addComponent(entityId, 'render', renderComponent);

    cm.addComponent(entityId, 'powerup', {
        typeId: powerUpConfig.typeId,
        effect: powerUpConfig.effect,
    });

    const lifetimeComponent = poolManager.acquire('lifetime');
    lifetimeComponent.expiresAt = Date.now() + powerUpConfig.durationOnFieldMs;
    cm.addComponent(entityId, 'lifetime', lifetimeComponent);

    const geoComponent = poolManager.acquire('collision_geometry');
    const powerUpSize = powerUpConfig.size;
    geoComponent.isCircle = false;
    geoComponent.width = powerUpSize.width;
    geoComponent.height = powerUpSize.height;
    geoComponent.aabb.width = powerUpSize.width;
    geoComponent.aabb.height = powerUpSize.height;
    geoComponent.aabb.x = startPosition.x - powerUpSize.width / 2;
    geoComponent.aabb.y = startPosition.y - powerUpSize.height / 2;
    cm.addComponent(entityId, 'collision_geometry', geoComponent);
}

module.exports = {
    addEnemyComponents,
    addEnemyBulletComponents,
    addPowerUpComponents
};