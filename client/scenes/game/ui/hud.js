import {DEPTHS} from './depths';
import {createStyledHudBar} from './styledHudBar';
import {createSkillBar} from './skillBar';
import {createTopBar} from './createTopBar';

/**
 * Форматирует секунды в строку ЧЧ:ММ:СС.
 * @param {number} seconds - Время в секундах.
 * @returns {string}
 */
function formatGameTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '00:00:00';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Создает все элементы HUD.
 * @param {Phaser.Scene} scene - Текущая игровая сцена.
 * @returns {object} - Объект HUD со ссылками на все его компоненты.
 */
export function createHud(scene) {
    const hud = {};
    hud.scene = scene;
    hud.baseMaxHp = 0;

    const scale = scene.scaleValue;

    const introDuration = 750;
    const introEase = 'Power2';

    const barWidth = scale(220);
    const finalBarX = scale(15);
    const initialBarY = scale(20);
    const barSpacing = scale(45);
    const initialBarX = finalBarX - (barWidth + 20);

    hud.shieldBar = createStyledHudBar(scene, initialBarX, initialBarY, 'SHD', 0x03BE61);
    hud.armorBar = createStyledHudBar(scene, initialBarX, initialBarY + barSpacing, 'ARM', 0x4A75D3);
    hud.hullBar = createStyledHudBar(scene, initialBarX, initialBarY + barSpacing * 2, 'HLL', 0xE663CB);
    hud.energyBar = createStyledHudBar(scene, initialBarX, initialBarY + barSpacing * 3, 'NRG', 0xD9D9D9);

    const topBar = createTopBar(scene);
    hud.topCenterContainer = topBar.container;
    hud.gameTimeText = topBar.gameTimeText;
    hud.killCountText = topBar.killCountText;

    const pingBarWidth = scale(150);
    const totalPingBarHeight = scale(40);
    const visiblePingBarHeight = scale(30);
    const pingCornerRadius = scale(10);
    hud.bottomRightContainer = scene.add.container(scene.startWidth, scene.startHeight).setDepth(DEPTHS.UI_HUD);
    const pingBackground = scene.add.graphics();
    pingBackground.fillStyle(0x000000, 0.3);
    pingBackground.fillRoundedRect(-pingBarWidth, -visiblePingBarHeight, pingBarWidth, totalPingBarHeight, pingCornerRadius);
    hud.bottomRightContainer.add(pingBackground);
    hud.pingText = scene.add.text(-pingBarWidth / 2, -visiblePingBarHeight / 2, 'Ping: 0 ms', {
        fontSize: `${Math.max(10, scale(16))}px`,
        fontFamily: 'Tektur',
        color: '#D9D9D9'
    }).setOrigin(0.5, 0.5);
    hud.bottomRightContainer.add(hud.pingText);

    const baseBarY = scene.startHeight - scale(60);
    hud.baseHpBar = createStyledHudBar(scene, initialBarX, baseBarY, 'GATE', 0xE663CB);

    hud.skillBarContainer = createSkillBar(scene);

    const finalSkillBarY = scene.startHeight - scale(50);
    const initialSkillBarY = scene.startHeight + scale(100);
    hud.skillBarContainer.setPosition(scene.startWidth / 2, initialSkillBarY);

    hud.gameTimeCounter = 0;

    hud.playIntroAnimation = () => {
        scene.tweens.add({
            targets: hud.shieldBar.container,
            x: finalBarX,
            duration: introDuration,
            ease: introEase,
            delay: 0
        });
        scene.tweens.add({
            targets: hud.armorBar.container,
            x: finalBarX,
            duration: introDuration,
            ease: introEase,
            delay: 100
        });
        scene.tweens.add({
            targets: hud.hullBar.container,
            x: finalBarX,
            duration: introDuration,
            ease: introEase,
            delay: 200
        });
        scene.tweens.add({
            targets: hud.energyBar.container,
            x: finalBarX,
            duration: introDuration,
            ease: introEase,
            delay: 300
        });
        scene.tweens.add({targets: hud.topCenterContainer, y: 0, duration: introDuration, ease: introEase, delay: 200});
        scene.tweens.add({
            targets: hud.baseHpBar.container,
            x: finalBarX,
            duration: introDuration,
            ease: introEase,
            delay: 400
        });
        scene.tweens.add({
            targets: hud.skillBarContainer,
            y: finalSkillBarY,
            duration: introDuration,
            ease: introEase,
            delay: 500
        });
    };

    hud.initialize = (initialShipData, initialBaseState) => {

        if (initialShipData) {

            const maxShield = initialShipData.modules.shield.module.params.shield.capacity;
            const maxArmor = initialShipData.modules.armor.module.params.armor.capacity;
            const maxHull = initialShipData.hull;
            const maxEnergy = initialShipData.modules.engine.module.params.energy.capacity;

            scene.playerShip.shield = maxShield;
            scene.playerShip.armor = maxArmor;
            scene.playerShip.hull = maxHull;
            scene.playerShip.energy = maxEnergy;

            hud.shieldBar.update(maxShield, maxShield);
            hud.armorBar.update(maxArmor, maxArmor);
            hud.hullBar.update(maxHull, maxHull);
            hud.energyBar.update(maxEnergy, maxEnergy);

            const hasTwoWeapons = initialShipData.modules.weapons.weapon2 && initialShipData.modules.weapons.weapon2.module.key;
            hud.skillBarContainer.setSwitchButtonState(hasTwoWeapons);
        }

        if (initialBaseState) {
            hud.baseMaxHp = initialBaseState.hp;
            hud.baseHpBar.update(initialBaseState.hp, hud.baseMaxHp);
        }
    };

    hud.destroy = () => {
        hud.shieldBar.destroy();
        hud.armorBar.destroy();
        hud.hullBar.destroy();
        hud.energyBar.destroy();
        if (hud.topCenterContainer) hud.topCenterContainer.destroy();
        if (hud.bottomRightContainer) hud.bottomRightContainer.destroy();
        hud.baseHpBar.destroy();
        hud.skillBarContainer.destroy();
    };

    return hud;
}

/**
 * Обновляет отображаемые в HUD данные.
 * @param {object} hud - Объект HUD.
 * @param {object} serverState - Состояние, полученное от сервера.
 */
export function updateHud(hud, serverState) {
    if (!hud || !hud.shieldBar || !hud.scene.playerShip || !hud.scene.shipConfig) {
        return;
    }

    const {playerShip, shipConfig} = hud.scene;

    if (hud.gameTimeText && hud.scene.gameTime !== undefined) {
        hud.gameTimeText.setText(formatGameTime(hud.scene.gameTime));
    }

    const maxShield = shipConfig.shield?.module?.params?.shield?.capacity;
    const maxArmor = shipConfig.armor?.module?.params?.armor?.capacity;
    const maxHull = shipConfig.hull;
    const maxEnergy = shipConfig.engine?.module?.params?.energy?.capacity;

    hud.shieldBar.update(playerShip.shield, maxShield);
    hud.armorBar.update(playerShip.armor, maxArmor);
    hud.hullBar.update(playerShip.hull, maxHull);
    hud.energyBar.update(playerShip.energy, maxEnergy);

}