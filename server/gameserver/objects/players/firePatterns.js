/**
 * Рассчитывает векторы скоростей для одиночного выстрела игрока.
 * Игрок всегда стреляет прямо вперед (по оси +X).
 * @param {object} weaponParams - Параметры активного оружия.
 * @returns {array} - Массив с одним объектом вектора скорости.
 */
function single(weaponParams) {
    const bulletSpeed = weaponParams.bullet.speed;
    return [{
        velocityX: bulletSpeed,
        velocityY: 0
    }];
}

/**
 * Рассчитывает векторы скоростей для веерного выстрела (дробовик) игрока.
 * @param {object} weaponParams - Параметры активного оружия.
 * @returns {array} - Массив с объектами векторов скорости для каждой дробинки.
 */
function spread(weaponParams) {
    const params = weaponParams.firePatternParams;
    const bulletCount = params.bulletCount;
    const spreadAngle = params.spreadAngle;
    const bulletSpeed = weaponParams.bullet.speed;

    const bullets = [];

    const spreadRad = spreadAngle * Math.PI / 180;

    const angleStep = bulletCount > 1 ? spreadRad / (bulletCount - 1) : 0;

    const startAngle = -spreadRad / 2;

    for (let i = 0; i < bulletCount; i++) {
        const angle = startAngle + i * angleStep;
        bullets.push({
            velocityX: bulletSpeed * Math.cos(angle),
            velocityY: bulletSpeed * Math.sin(angle)
        });
    }
    return bullets;
}

const playerFirePatterns = {
    single,
    spread,

};

module.exports = {playerFirePatterns};