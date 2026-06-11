import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../core/utils';

const RARITY_COLORS = {
    default: '#e0e0e0',
    common: '#758BA0',
    uncommon: '#42DA9D',
    rare: '#41C6FF',
    epic: '#C029E5',
    legendary: '#FEBA00',
};

/**
 * Creates a paginated grid container for displaying looted items.
 * @param {Phaser.Scene} scene - The Phaser scene.
 * @param {Array<object>} items - Array of all item objects to display.
 * @returns {Phaser.GameObjects.Container} - The created grid container with pagination controls.
 */
export function createLootGrid(scene, items) {
    const scale = scene.scaleValue;

    const GRID_COLS = 4;
    const GRID_ROWS = 4;
    const ITEMS_PER_PAGE = GRID_COLS * GRID_ROWS;
    const CELL_SIZE = scale(110);
    const CELL_GAP = scale(15);
    const NAV_HEIGHT = scale(50);

    const totalGridWidth = (GRID_COLS * CELL_SIZE) + ((GRID_COLS - 1) * CELL_GAP);
    const totalGridHeight = (GRID_ROWS * CELL_SIZE) + ((GRID_ROWS - 1) * CELL_GAP);

    const numPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    let currentPageIndex = 0;

    const mainContainer = scene.add.container(-totalGridWidth / 2, 0);
    const pages = [];

    for (let i = 0; i < numPages; i++) {
        const pageContainer = scene.add.container(0, 0);
        const pageItems = items.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);

        pageItems.forEach((item, index) => {
            const row = Math.floor(index / GRID_COLS);
            const col = index % GRID_COLS;
            const cellX = col * (CELL_SIZE + CELL_GAP);
            const cellY = row * (CELL_SIZE + CELL_GAP);

            const cell = scene.add.container(cellX, cellY);
            const bg = scene.add.graphics();

            bg.fillStyle(0xffffff, 0.05);
            bg.fillRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 5);

            const rarityColorHex = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
            const rarityColor = Phaser.Display.Color.HexStringToColor(rarityColorHex).color;

            bg.lineStyle(scale(3), rarityColor, 0.9);
            bg.strokeRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 5);

            bg.lineStyle(1, 0xffffff, 0.1);
            bg.strokeRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 5);

            const baseTextureKey = item.key.startsWith('stagestone_tier_') ? 'stagestone_texture' : item.key;
            const {textureKey, scale: iconScale} = selectTextureAndScale(scene, baseTextureKey, CELL_SIZE * 0.6);
            const icon = scene.add.image(CELL_SIZE / 2, CELL_SIZE / 2 - scale(10), textureKey).setScale(iconScale);
            const amountText = scene.add.text(CELL_SIZE / 2, CELL_SIZE - scale(20), `x${item.amount}`, {
                fontFamily: 'Tektur', fontSize: `${scale(16)}px`, color: '#ffffff',
            }).setOrigin(0.5);

            cell.add([bg, icon, amountText]);
            pageContainer.add(cell);
        });

        pageContainer.setVisible(i === 0);
        mainContainer.add(pageContainer);
        pages.push(pageContainer);
    }

    if (numPages > 1) {

        const NAV_SPACING = scale(40);

        const navY = totalGridHeight + NAV_SPACING + NAV_HEIGHT / 2;

        const pageIndicator = scene.add.text(totalGridWidth / 2, navY, `1 / ${numPages}`, {
            fontFamily: 'Tektur', fontSize: `${scale(18)}px`, color: '#aaaaaa'
        }).setOrigin(0.5);

        const {textureKey: prevKey, scale: prevScale} = selectTextureAndScale(scene, 'arrowL', scale(32));
        const prevButton = scene.add.image(pageIndicator.x - scale(60), navY, prevKey)
            .setScale(prevScale)
            .setInteractive({useHandCursor: true});

        const {textureKey: nextKey, scale: nextScale} = selectTextureAndScale(scene, 'arrowR', scale(32));
        const nextButton = scene.add.image(pageIndicator.x + scale(60), navY, nextKey)
            .setScale(nextScale)
            .setInteractive({useHandCursor: true});

        mainContainer.add([prevButton, nextButton, pageIndicator]);

        const updateNavState = () => {
            pageIndicator.setText(`${currentPageIndex + 1} / ${numPages}`);
            prevButton.setAlpha(currentPageIndex === 0 ? 0.3 : 1).setInteractive(currentPageIndex > 0);
            nextButton.setAlpha(currentPageIndex === numPages - 1 ? 0.3 : 1).setInteractive(currentPageIndex < numPages - 1);
        };

        const switchPage = (newIndex) => {
            if (newIndex === currentPageIndex || newIndex < 0 || newIndex >= numPages) return;

            const oldPage = pages[currentPageIndex];
            const newPage = pages[newIndex];
            const direction = newIndex > currentPageIndex ? 1 : -1;

            scene.tweens.add({
                targets: oldPage, x: -direction * scale(200), alpha: 0,
                duration: 250, ease: 'Sine.easeIn', onComplete: () => oldPage.setVisible(false)
            });

            newPage.x = direction * scale(200);
            newPage.setAlpha(0).setVisible(true);
            scene.tweens.add({
                targets: newPage, x: 0, alpha: 1,
                duration: 250, ease: 'Sine.easeOut', delay: 100
            });

            currentPageIndex = newIndex;
            updateNavState();
        };

        prevButton.on('pointerdown', () => switchPage(currentPageIndex - 1));
        nextButton.on('pointerdown', () => switchPage(currentPageIndex + 1));

        updateNavState();
    }

    return mainContainer;
}