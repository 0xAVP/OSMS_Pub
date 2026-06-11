import {ActionButton} from '../../../components/ActionButton.js';
import {DEFAULTS as PANEL_DEFAULTS} from '../../../components/SidePanel.js';
import {getCatalogData} from '../../../../wallet/catalog.js';
import {Utils, selectTextureAndScale} from '../../../../../core/utils.js';
import {cancelCraft, finishCraft} from '../../../processing/craftHandler.js';

export function createFactoryManager(scene) {
    const container = scene.add.container(0, 0);
    const availableWidth = 800 - PANEL_DEFAULTS.padding * 2;
    const factoryKeys = ['factory1', 'factory2', 'factory3'];
    const productionLines = {};

    const blockHeight = 200;
    const verticalGap = 20;
    let currentY = 0;

    factoryKeys.forEach((key) => {
        const lineElements = createProductionLine(scene, key, availableWidth, blockHeight);
        lineElements.container.setPosition(0, currentY + (blockHeight / 2));
        container.add(lineElements.container);
        productionLines[key] = lineElements;
        currentY += blockHeight + verticalGap;
    });

    const onFactoryUpdate = ({factoryKey, factoryData}) => {
        if (productionLines[factoryKey]) {
            productionLines[factoryKey].update(factoryData);
        }
    };

    const updateAllFactories = () => {
        if (!container.scene) return;
        const factories = scene.craftFactories || {};
        factoryKeys.forEach(key => {
            const factoryData = factories[key] || {state: 'idle'};
            productionLines[key].update(factoryData);
        });
    };

    scene.events.on('factory-updated', onFactoryUpdate);

    container.on('destroy', () => {
        scene.events.off('factory-updated', onFactoryUpdate);
        Object.values(productionLines).forEach(line => line.destroy());
    });

    updateAllFactories();

    return {
        factoryContainer: container,
        updateFactoryUI: updateAllFactories,
        destroy: () => container.destroy(),
    };
}

function createProductionLine(scene, factoryKey, width, height) {
    const container = scene.add.container(0, 0);
    let timer = null;

    const PADDING = 20;

    const NAME_Y = -height / 2 + 30;
    const PROGRESS_Y = NAME_Y + 40;
    const TIME_Y = PROGRESS_Y + 30;
    const BUTTON_Y = height / 2 - 35;

    const itemNameText = scene.add.text(0, NAME_Y, "Idle", {
        fontFamily: 'Tektur',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: {width: width - PADDING * 2}
    }).setOrigin(0.5);
    const timeText = scene.add.text(0, TIME_Y, ``, {
        fontFamily: 'Tektur',
        fontSize: '16px',
        color: '#cccccc'
    }).setOrigin(0.5);

    const progressBarWidth = width * 0.5;
    const progressBarHeight = 12;
    const progressBarBg = scene.add.graphics({
        x: 0,
        y: PROGRESS_Y
    }).fillStyle(0x101216, 1).fillRoundedRect(-progressBarWidth / 2, -progressBarHeight / 2, progressBarWidth, progressBarHeight, progressBarHeight / 2);
    const progressBarFill = scene.add.graphics({x: 0, y: PROGRESS_Y});
    container.add([itemNameText, timeText, progressBarBg, progressBarFill]);

    const collectButton = new ActionButton(scene, {x: 0, y: BUTTON_Y, texture: 'collect', scale: 0.8});
    const cancelButton = new ActionButton(scene, {x: 0, y: BUTTON_Y, texture: 'cancel', scale: 0.8});
    container.add([collectButton, cancelButton])

    const update = (factoryData) => {
        if (!container.scene) return;
        if (timer) timer.destroy();

        const isBusy = (factoryData.state === 'crafting' || factoryData.state === 'done' || factoryData.state === 'paused');
        const blueprintData = isBusy ? getCatalogData(scene, factoryData.blueprintKey, 'blueprints') : null;

        if (blueprintData && blueprintData.itemCrafted) {
            const itemCraftedKey = Object.keys(blueprintData.itemCrafted || {})[0];
            const itemCraftedMeta = blueprintData.itemCrafted[itemCraftedKey];
            const itemCraftedCategory = itemCraftedMeta?.category;
            const craftedItemData = getCatalogData(scene, itemCraftedKey, itemCraftedCategory);
            const finalItemName = craftedItemData.name || blueprintData.name;

            const runs = factoryData.quantity || 1;
            const quantityPerRun = itemCraftedMeta?.quantity || 1;
            const totalQuantity = runs * quantityPerRun;

            itemNameText.setText(`${finalItemName} x${totalQuantity}`);

        } else {
            itemNameText.setText("Line is empty");
        }

        collectButton.setData('factoryData', factoryData);
        cancelButton.setData('factoryData', factoryData);

        switch (factoryData.state) {
            case 'crafting':
                collectButton.setVisible(false);
                cancelButton.setVisible(true).enable();
                progressBarBg.setVisible(true);
                progressBarFill.setVisible(true);
                const startTimeMs = Number(factoryData.startTime);
                const endTimeMs = Number(factoryData.endTime);
                const totalDuration = endTimeMs - startTimeMs;
                timer = scene.time.addEvent({
                    delay: 200, loop: true,
                    callback: () => {
                        if (!container.scene) {
                            if (timer) timer.destroy();
                            return;
                        }
                        const now = Utils.getCurrentServerTime(scene);
                        const elapsed = now - startTimeMs;
                        const progress = Math.min(1, elapsed / totalDuration);
                        const remainingMs = Math.max(0, endTimeMs - now);
                        progressBarFill.clear().fillStyle(0x41C6FF, 1).fillRoundedRect(-progressBarWidth / 2, -progressBarHeight / 2, progressBarWidth * progress, progressBarHeight, progressBarHeight / 2);
                        if (remainingMs > 0) {
                            timeText.setText(Utils.formatCountdown(remainingMs, true));
                        } else {
                            timeText.setText("Finalizing...");
                            timer.destroy();
                            timer = null;
                            scene.events.emit('factory-updated', {
                                factoryKey: factoryKey,
                                factoryData: {...factoryData, state: 'done'}
                            });
                        }
                    }
                });
                break;
            case 'done':
                timeText.setText('Finished!');
                cancelButton.setVisible(false);
                collectButton.setVisible(true).enable();
                progressBarBg.setVisible(true);
                progressBarFill.setVisible(true).clear().fillStyle(0x42DA9D, 1).fillRoundedRect(-progressBarWidth / 2, -progressBarHeight / 2, progressBarWidth, progressBarHeight, progressBarHeight / 2);
                break;
            case 'paused':
                collectButton.setVisible(false);

                cancelButton.setVisible(true).enable();
                progressBarBg.setVisible(true);
                progressBarFill.setVisible(true);

                const totalCraftTime = (factoryData.startTime + factoryData.timeRemainingMs) - factoryData.startTime;
                const progressPaused = totalCraftTime > 0 ? 1 - (factoryData.timeRemainingMs / totalCraftTime) : 0;

                progressBarFill.clear().fillStyle(0xffa500, 1).fillRoundedRect(-progressBarWidth / 2, -progressBarHeight / 2, progressBarWidth * progressPaused, progressBarHeight, progressBarHeight / 2);

                timeText.setText(`Paused | Echo required`);
                break;
            default:
                timeText.setText('Idle');
                cancelButton.setVisible(false);
                collectButton.setVisible(false);
                progressBarBg.setVisible(true);
                progressBarFill.clear().setVisible(false);
                break;
        }
    };

    collectButton.on('click', () => {
        const buttonData = collectButton.getData('factoryData');
        if (!buttonData) return;

        const collectPromise = finishCraft(scene, factoryKey, buttonData.factoryUid)
            .catch(error => {
                console.error("Collect action failed:", error.message);
            });

        collectButton.trackPromise(collectPromise);
    });

    cancelButton.on('click', () => {
        const buttonData = cancelButton.getData('factoryData');
        if (!buttonData) return;

        scene.modalManager.show('confirm', {
            message: 'Are you sure? \nAll materials will be lost.',
            onConfirm: async () => {
                await cancelCraft(scene, factoryKey, buttonData.factoryUid);
            },
            onCancel: () => console.log('Craft cancellation aborted.')
        });
    });

    const destroy = () => {
        if (timer) timer.destroy();
        container.destroy();
    };

    return {container, update, destroy};
}