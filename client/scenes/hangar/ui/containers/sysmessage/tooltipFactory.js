import {craftedTooltipHandler} from './craftedTooltip.js';
import {upgradeTooltipHandler} from './upgradeTooltip.js';

const tooltipHandlers = {
    crafted: craftedTooltipHandler,
    upgrade: upgradeTooltipHandler,
};

export function createTooltip(scene, sysMessageContainer, containerHeight, tooltipType) {
    const handler = tooltipHandlers[tooltipType];
    if (!handler) {
        console.warn(`Unknown tooltip type: ${tooltipType}, tooltip will not be displayed`);
        return {container: scene.add.container(0, 0).setVisible(false), update: () => false};
    }
    return handler(scene, sysMessageContainer, containerHeight);
}