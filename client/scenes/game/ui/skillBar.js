import Phaser from 'phaser';
import {DEPTHS} from './depths';
import {selectTextureAndScale} from '../../core/utils';

function createSkillSlot(scene, x, y, keyBind, iconKey, isActive = false) {
    const scale = scene.scaleValue;
    const SLOT_SIZE = scale(64);
    const KEY_FONT_SIZE = scale(14);
    const KEY_OFFSET_Y = scale(8);
    const STROKE_THICKNESS = Math.max(1, scale(2));
    const KEY_STROKE_THICKNESS = Math.max(1, scale(3));

    const slotContainer = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const ICON_TARGET_SIZE_IN_SLOT = SLOT_SIZE * 0.5;
    const {textureKey, scale: iconScale} = selectTextureAndScale(scene, iconKey, ICON_TARGET_SIZE_IN_SLOT);

    const icon = scene.add.image(0, 0, textureKey).setScale(iconScale).setOrigin(0.5);
    const keyText = scene.add.text(0, SLOT_SIZE / 2 - KEY_OFFSET_Y, keyBind, {
        fontFamily: 'Tektur',
        fontSize: `${KEY_FONT_SIZE}px`,
        color: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: KEY_STROKE_THICKNESS
    }).setOrigin(0.5);

    slotContainer.bg = bg;
    slotContainer.icon = icon;
    slotContainer.keyText = keyText;

    slotContainer.setActiveState = (active) => {
        const bgColor = active ? 0x41C6FF : 0x555555;
        const bgAlpha = active ? 0.2 : 0.2;
        const strokeColor = active ? 0xADEBFF : 0x888888;
        const strokeAlpha = active ? 0.5 : 0.5;
        const textColor = active ? '#aaaaaa' : '#aaaaaa';

        bg.clear();
        bg.fillStyle(bgColor, bgAlpha);
        bg.fillCircle(0, 0, SLOT_SIZE / 2);
        bg.lineStyle(STROKE_THICKNESS, strokeColor, strokeAlpha);
        bg.strokeCircle(0, 0, SLOT_SIZE / 2);

        keyText.setColor(textColor);
        icon.setAlpha(active ? 1.0 : 0.5);
    };

    slotContainer.setActiveState(isActive);

    slotContainer.add([bg, icon, keyText]);
    return slotContainer;
}

function createCooldownIndicator(scene, size) {
    const scale = scene.scaleValue;
    const container = scene.add.container(0, 0).setVisible(false);
    const radius = size / 2;
    const arcThickness = scale(5);
    const trackColor = 0x222222;
    const progressColor = 0x00ffff;
    const castingColor = 0xffd700;

    const background = scene.add.graphics();
    background.fillStyle(0x000000, 0.6);
    background.fillCircle(0, 0, radius);
    container.add(background);

    const track = scene.add.graphics();
    track.lineStyle(arcThickness, trackColor, 0.5);
    track.strokeCircle(0, 0, radius - arcThickness / 2);
    container.add(track);

    const progressArc = scene.add.graphics();
    container.add(progressArc);

    const progressGlow = scene.add.graphics();
    progressGlow.lineStyle(arcThickness * 2, progressColor, 0.3);
    progressGlow.strokeCircle(0, 0, radius - arcThickness / 2);
    progressGlow.setAlpha(0);
    container.add(progressGlow);

    const countdownText = scene.add.text(0, 0, '', {
        fontFamily: 'Orbitron',
        fontSize: `${size * 0.3}px`,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: scale(4)
    }).setOrigin(0.5);
    container.add(countdownText);

    container.activeTween = null;

    container.startAnimation = (duration, onComplete) => {
        container.stopAnimation();
        container.setVisible(true);
        progressGlow.setAlpha(1);

        scene.tweens.add({
            targets: progressGlow,
            alpha: 0.5,
            duration: duration / 2,
            yoyo: true,
            repeat: -1
        });

        container.activeTween = scene.tweens.addCounter({
            from: 0,
            to: 360,
            duration: duration,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const angle = tween.getValue();
                const remainingTime = (duration - tween.elapsed) / 1000;
                countdownText.setText(remainingTime.toFixed(1));

                progressArc.clear();
                progressArc.lineStyle(arcThickness, progressColor, 1);
                progressArc.beginPath();
                progressArc.arc(0, 0, radius - arcThickness / 2, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(angle - 90), false);
                progressArc.strokePath();
            },
            onComplete: () => {

                const flash = scene.add.graphics();
                container.add(flash);
                flash.lineStyle(arcThickness * 1.5, 0xffffff, 1);
                flash.strokeCircle(0, 0, radius - arcThickness / 2);
                scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 250,
                    onComplete: () => flash.destroy()
                });

                container.setVisible(false);
                container.activeTween = null;
                if (onComplete) onComplete();
            }
        });
    };

    container.startCastingAnimation = () => {
        container.stopAnimation();
        container.setVisible(true);
        countdownText.setText('');

        container.activeTween = scene.tweens.add({
            targets: {angle: 0},
            angle: 360,
            duration: 1000,
            repeat: -1,
            onUpdate: (tween) => {
                const angle = tween.targets[0].angle;
                progressArc.clear();
                progressArc.lineStyle(arcThickness, castingColor, 1);
                progressArc.beginPath();
                progressArc.arc(0, 0, radius - arcThickness / 2, Phaser.Math.DegToRad(angle - 90), Phaser.Math.DegToRad(angle), false);
                progressArc.strokePath();
            }
        });
    };

    container.stopAnimation = () => {
        if (container.activeTween) {
            container.activeTween.stop();
            container.activeTween = null;
        }
        scene.tweens.killTweensOf(progressGlow);
        progressArc.clear();
        progressGlow.setAlpha(0);
        container.setVisible(false);
    };

    return container;
}

export function createSkillBar(scene) {
    const scale = scene.scaleValue;
    const SLOT_COUNT = 6;
    const SLOT_SIZE = scale(64);
    const SLOT_GAP = scale(15);
    const ICON_TARGET_SIZE = SLOT_SIZE * 0.5;

    const skillBarContainer = scene.add.container(0, 0).setDepth(DEPTHS.UI_HUD);
    const totalWidth = (SLOT_COUNT * SLOT_SIZE) + ((SLOT_COUNT - 1) * SLOT_GAP);
    const startX = -totalWidth / 2 + SLOT_SIZE / 2;

    const keyBinds = ['TAB', '1', '2', '3', '4', '5'];

    for (let i = 0; i < SLOT_COUNT; i++) {
        const x = startX + i * (SLOT_SIZE + SLOT_GAP);

        let iconKey;
        let isActive;

        if (i === 0) {

            iconKey = 'icon_change_weapon_bw';
            isActive = false;
        } else {

            iconKey = 'icon_lock';
            isActive = false;
        }

        const slot = createSkillSlot(scene, x, 0, keyBinds[i], iconKey, isActive);

        if (i === 0) {
            const cooldownIndicator = createCooldownIndicator(scene, SLOT_SIZE);
            slot.add(cooldownIndicator);
            skillBarContainer.cooldownIndicator = cooldownIndicator;
            skillBarContainer.switchSlot = slot;
        }

        skillBarContainer.add(slot);
    }

    /**
     * Устанавливает активное или неактивное состояние для кнопки переключения оружия.
     * @param {boolean} hasTwoWeapons - true, если у игрока есть второе оружие.
     */
    skillBarContainer.setSwitchButtonState = (hasTwoWeapons) => {
        if (skillBarContainer.switchSlot) {
            skillBarContainer.switchSlot.setActiveState(hasTwoWeapons);
            const iconKey = hasTwoWeapons ? 'icon_change_weapon' : 'icon_change_weapon_bw';
            const {textureKey, scale} = selectTextureAndScale(scene, iconKey, ICON_TARGET_SIZE);
            skillBarContainer.switchSlot.icon.setTexture(textureKey).setScale(scale);
        }
    };

    return skillBarContainer;
}