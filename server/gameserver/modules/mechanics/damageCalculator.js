function calculatePlayerDamage(weaponParams, session) {
    const {damage} = weaponParams;
    const cm = session.componentManager;
    const cachedStats = cm.getComponent(session.playerEntityId, 'cached_stats');

    if (!cachedStats) {
        let baseDamage = Math.floor(Math.random() * (damage.max - damage.min + 1)) + damage.min;
        return {finalDamage: baseDamage, isCritical: false};
    }

    let finalDamage = Math.floor(Math.random() * (damage.max - damage.min + 1)) + damage.min;
    let isCritical = false;

    finalDamage *= cachedStats.damageMultiplier;

    const roll = Math.random() * 100;
    if (roll <= cachedStats.critChance) {
        isCritical = true;
        const critMultiplier = cachedStats.critModifier / 100;
        finalDamage = Math.floor(finalDamage * critMultiplier);
    }

    return {finalDamage, isCritical};
}

function calculateAbsorption(incomingDamage, session, playerEntityId) {
    const cm = session.componentManager;
    const cachedStats = cm.getComponent(playerEntityId, 'cached_stats');
    if (!cachedStats) return {finalDamage: incomingDamage, absorbedAmount: 0};

    let finalDamage = incomingDamage;
    let absorbedAmount = 0;

    const finalChance = cachedStats.armorAbsorptionChance;
    const finalAmount = cachedStats.armorAbsorptionAmount;

    if (finalChance > 0 && finalAmount > 0) {
        if (Math.random() * 100 <= finalChance) {
            absorbedAmount = Math.min(finalDamage, finalAmount);
            finalDamage -= absorbedAmount;
        }
    }
    return {finalDamage, absorbedAmount};
}

function checkEvasion(session, playerEntityId) {
    const cm = session.componentManager;
    const cachedStats = cm.getComponent(playerEntityId, 'cached_stats');
    if (!cachedStats) return false;

    const finalEvasionChance = cachedStats.evasion;

    if (finalEvasionChance > 0) {
        return (Math.random() * 100 <= finalEvasionChance);
    }
    return false;
}

module.exports = {calculatePlayerDamage, calculateAbsorption, checkEvasion};