import {createTooltip} from './tooltipFactory.js';

export function createItemTooltip(scene, sysMessageContainer, containerHeight) {
    let currentTooltip = null;

    const showTooltip = (itemData, x, y) => {
        if (!itemData || !itemData.tooltipType) return;

        if (!currentTooltip || currentTooltip.type !== itemData.tooltipType) {
            if (currentTooltip) currentTooltip.container.destroy();
            currentTooltip = createTooltip(scene, sysMessageContainer, containerHeight, itemData.tooltipType);
            currentTooltip.type = itemData.tooltipType;
            sysMessageContainer.tooltipContainer = currentTooltip.container;
        }

        if (currentTooltip.update(itemData)) {
            currentTooltip.container.setVisible(true);
            if (sysMessageContainer.timer) sysMessageContainer.timer.paused = true;
        }
    };

    const hideTooltip = () => {
        if (currentTooltip) currentTooltip.container.setVisible(false);
        if (sysMessageContainer.timer) sysMessageContainer.timer.paused = false;
    };

    const destroy = () => {

        if (currentTooltip && currentTooltip.container) {
            currentTooltip.container.destroy();
        }
        currentTooltip = null;
        console.log('ItemTooltip handler destroyed.');
    };

    return {showTooltip, hideTooltip, destroy};
}