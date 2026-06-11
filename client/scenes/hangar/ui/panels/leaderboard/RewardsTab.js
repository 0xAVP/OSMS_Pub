import {RewardsGridDisplay} from './RewardsGridDisplay.js';

export function createRewardsTab(scene, totalWidth, availableHeight) {
    const mainContainer = scene.add.container(0, 0);
    let gridDisplay = null;

    mainContainer.update = (rewardsData) => {
        if (gridDisplay) {
            gridDisplay.destroy();
        }

        gridDisplay = new RewardsGridDisplay(scene, totalWidth, availableHeight);
        gridDisplay.show(rewardsData);
        mainContainer.add(gridDisplay);
    };

    mainContainer.resize = (newHeight) => {

    };

    return mainContainer;
}
