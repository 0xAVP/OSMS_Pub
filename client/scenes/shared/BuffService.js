/**
 * @file Клиентский сервис для работы с баффами.
 * Работает с кэшем активных баффов в Registry и каталогом определений.
 */


const ACTIVE_BUFFS_KEY = 'active_buffs';

/**
 * Получает полное определение (definition) для любого баффа,
 * комбинируя статические и динамически генерируемые данные из кэша каталогов.
 * @param {Phaser.Scene} scene - Текущая сцена.
 * @param {string} buffId - ID баффа.
 * @returns {object|null}
 */
export function getBuffDefinition(scene, buffId) {
    if (!buffId || !scene.catalog || !scene.catalog.buffs) {
        console.warn(`Cannot get buff definition: Buff catalog is not loaded.`);
        return null;
    }
    const buffCatalog = scene.catalog.buffs;

    if (buffCatalog[buffId]) {
        return {buffId, ...buffCatalog[buffId]};
    }

    const timePortalTemplate = buffCatalog.templates?.time_portal;
    if (timePortalTemplate && buffId.startsWith('timePortal_buff_tier_')) {
        const tierString = buffId.replace('timePortal_buff_tier_', '');
        const tier = parseInt(tierString, 10);

        if (!isNaN(tier) && tier > 0) {
            const unlockedStage = (tier - 1) * 5 + 5;

            const generatedBuffDef = {
                buffId: buffId,
                group: timePortalTemplate.group,
                name: timePortalTemplate.name,
                groupName: timePortalTemplate.groupName,
                durationMs: timePortalTemplate.durationMs,
                isStackable: timePortalTemplate.isStackable,
                texture: timePortalTemplate.texture,
                effects: {unlockedStage: unlockedStage}
            };

            console.log('[DEBUG BuffService] Returning generated definition:', JSON.parse(JSON.stringify(generatedBuffDef)));

            return generatedBuffDef;

        }
    }

    console.warn(`Buff definition not found for ID: ${buffId}`);
    return null;
}

/**
 * Получает объект с данными активного баффа из кэша в Registry.
 * @param {Phaser.Scene} scene - Текущая сцена.
 * @param {string} buffId - ID баффа.
 * @returns {object|null} - Данные баффа ({ buffId, expiresAt, ... }) или null.
 */
export function getActiveBuff(scene, buffId) {
    const activeBuffs = scene.registry.get(ACTIVE_BUFFS_KEY) || {};
    const buff = activeBuffs[buffId];

    if (buff && Date.now() < new Date(buff.expiresAt).getTime()) {
        return buff;
    }

    return null;
}

/**
 * Проверяет, активен ли бафф в данный момент.
 * @param {Phaser.Scene} scene - Текущая сцена.
 * @param {string} buffId - ID баффа.
 * @returns {boolean}
 */
export function isBuffActive(scene, buffId) {
    return !!getActiveBuff(scene, buffId);
}

/**
 * Проверяет наличие активного баффа по ГРУППЕ.
 * @param {Phaser.Scene} scene - Текущая сцена.
 * @param {string} groupName - Название группы (например, 'stagestone').
 * @returns {object|null} - Данные первого найденного активного баффа из этой группы.
 */
export function getActiveBuffByGroup(scene, groupName) {
    const activeBuffs = scene.registry.get(ACTIVE_BUFFS_KEY) || {};
    const now = Date.now();

    for (const buffId in activeBuffs) {
        const buff = activeBuffs[buffId];

        const buffDef = getBuffDefinition(scene, buffId);

        if (buffDef && buffDef.group === groupName && now < new Date(buff.expiresAt).getTime()) {

            return buff;
        }
    }

    return null;
}

/**
 * Функция для вызова в update() для удаления просроченных баффов из КЭША.
 * Это нужно для мгновенного обновления UI.
 * @param {Phaser.Scene} scene - Текущая сцена.
 */
export function checkExpiredBuffs(scene) {
    const buffs = scene.registry.get(ACTIVE_BUFFS_KEY) || {};
    const now = Date.now();
    let changed = false;

    for (const buffId in buffs) {
        const expiresAt = new Date(buffs[buffId].expiresAt).getTime();
        if (now >= expiresAt) {
            delete buffs[buffId];
            changed = true;
        }
    }

    if (changed) {
        scene.registry.set(ACTIVE_BUFFS_KEY, buffs);
        console.log("Expired buffs removed from client Registry cache.");
    }
}

let expirationCheckerTimer = null;

/**
 * Запускает периодическую проверку активных баффов на истечение срока.
 * @param {Phaser.Scene} scene - Текущая сцена.
 */
export function startBuffExpirationChecker(scene) {

    if (expirationCheckerTimer) {
        console.warn('Buff expiration checker is already running.');
        return;
    }

    expirationCheckerTimer = scene.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {

            const activeBuffs = scene.registry.get('active_buffs') || {};
            const timeDelta = scene.registry.get('time_delta') || 0;

            if (Object.keys(activeBuffs).length === 0) {
                return;
            }

            const correctedNow = Date.now() + timeDelta;
            let hasChanged = false;

            const updatedBuffs = {...activeBuffs};

            for (const buffId in updatedBuffs) {
                const buff = updatedBuffs[buffId];
                const expiresAt = new Date(buff.expiresAt).getTime();

                if (correctedNow >= expiresAt) {
                    delete updatedBuffs[buffId];
                    hasChanged = true;
                    console.log(`Buff '${buffId}' expired and removed from client cache.`);
                }
            }

            if (hasChanged) {
                scene.registry.set('active_buffs', updatedBuffs);
            }
        }
    });

    console.log('Buff expiration checker started.');
}

/**
 * Останавливает периодическую проверку баффов.
 */
export function stopBuffExpirationChecker() {
    if (expirationCheckerTimer) {
        expirationCheckerTimer.destroy();
        expirationCheckerTimer = null;
        console.log('Buff expiration checker stopped.');
    }
}