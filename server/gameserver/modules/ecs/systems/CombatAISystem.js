const System = require('./System');
const logger = require("../../../core/logger");

function getDistanceSq(posA, posB) {
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    return dx * dx + dy * dy;
}

class CombatAISystem extends System {
    constructor() {
        super();
        logger.info('[ECS:CombatAISystem] Initialized.');
    }

    /**
     * Анализирует боевую тактику, описанную в текущем состоянии поведения,
     * и принимает решение о необходимости выстрела.
     */
    update(entityId, cm, session) {
        const behavior = cm.getComponent(entityId, 'behavior');
        const weaponState = cm.getComponent(entityId, 'weaponState');

        if (!behavior || !behavior.script || !weaponState) {
            return;
        }

        weaponState.fireRequested = false;

        const currentStateDef = behavior.script[behavior.currentStateIndex];

        if (!currentStateDef || !currentStateDef.combat) {
            return;
        }

        const combatRules = currentStateDef.combat;

        switch (combatRules.tactic) {

            case 'always_fire':
                weaponState.fireRequested = true;
                break;

            case 'fire_if_player_in_range': {
                const range = combatRules.range;

                if (!range) break;

                const selfPosition = cm.getComponent(entityId, 'position');
                const playerPosition = cm.getComponent(session.playerEntityId, 'position');

                if (selfPosition && playerPosition) {
                    const distanceSq = getDistanceSq(selfPosition, playerPosition);

                    if (distanceSq < range * range) {
                        weaponState.fireRequested = true;
                    }
                }
                break;
            }

            default:

                break;
        }

    }
}

module.exports = new CombatAISystem();