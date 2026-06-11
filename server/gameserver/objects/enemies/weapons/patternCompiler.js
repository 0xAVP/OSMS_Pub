const Targeting = {
    /** Целится в игрока. */
    player: (components, session) => {
        const {position} = components;

        const playerPosition = session.componentManager.getComponent(session.playerEntityId, 'position');

        if (!playerPosition) {
            return Math.PI;
        }

        const dx = playerPosition.x - position.x;
        const dy = playerPosition.y - position.y;
        return Math.atan2(dy, dx);

    },

    /** Целится прямо влево. */
    forward: (components, session) => {
        return Math.PI;
    },

    /** Целится в направлении движения сущности. */
    velocity: (components, session) => {
        const {velocity} = components;
        return Math.atan2(velocity.y, velocity.x);
    },

    current_rotation: (components, session) => {
        const {position} = components;

        return position.rotation || 0;
    }
};

const Shapes = {
    /** Создает один вектор скорости. */
    single: (baseAngle, params, weaponParams) => {
        const bulletSpeed = weaponParams.bulletSpeed;

        const offsetDeg = params.angleOffset || 0;
        const finalAngle = baseAngle + (offsetDeg * Math.PI / 180);

        return [{
            x: bulletSpeed * Math.cos(finalAngle),
            y: bulletSpeed * Math.sin(finalAngle)
        }];
    },

    /** Создает веер векторов. */
    spread: (baseAngle, params, weaponParams) => {
        const bulletSpeed = weaponParams.bulletSpeed;
        const {bulletCount = 3, spreadAngle = 30} = params;
        const vectors = [];
        const angleStep = bulletCount > 1 ? (spreadAngle * Math.PI / 180) / (bulletCount - 1) : 0;
        const startAngle = baseAngle - (spreadAngle * Math.PI / 180) / 2;

        for (let i = 0; i < bulletCount; i++) {
            const angle = startAngle + i * angleStep;
            vectors.push({
                x: bulletSpeed * Math.cos(angle),
                y: bulletSpeed * Math.sin(angle)
            });
        }
        return vectors;
    },

    /** Создает круговой залп. */
    round: (baseAngle, params, weaponParams) => {
        const bulletSpeed = weaponParams.bulletSpeed;
        const {bulletCount = 6} = params;
        const vectors = [];
        const angleStep = (2 * Math.PI) / bulletCount;

        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle + i * angleStep;
            vectors.push({
                x: bulletSpeed * Math.cos(angle),
                y: bulletSpeed * Math.sin(angle)
            });
        }
        return vectors;
    }
};

function compilePattern(patternConfig) {
    return (components, session) => {
        const {weaponState} = components;

        const activeIndex = weaponState.activeWeaponIndex || 0;
        const weaponParams = weaponState.weapons[activeIndex]?.weapon;

        if (!weaponParams) {
            return {immediateVectors: [], shotQueue: null};
        }

        const targetingFunc = Targeting[patternConfig.targeting] || Targeting.forward;
        const baseAngle = targetingFunc(components, session);

        const shapeFunc = Shapes[patternConfig.shape] || Shapes.single;
        const vectors = shapeFunc(baseAngle, patternConfig.params || {}, weaponParams);

        const burstParams = weaponParams.fireParams?.burst;
        let shotQueue = null;
        let immediateVectors = vectors;

        if (burstParams && burstParams.bulletCount > 1 && vectors.length > 0) {
            shotQueue = {
                remaining: burstParams.bulletCount - 1,
                delay: burstParams.delayMs || 100,
                vector: vectors[0],
                lastShotTime: Date.now()
            };
            immediateVectors = [vectors[0]];
        }

        return {
            immediateVectors: immediateVectors,
            shotQueue: shotQueue
        };
    };
}

module.exports = {compilePattern};