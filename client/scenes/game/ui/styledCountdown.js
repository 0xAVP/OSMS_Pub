import {DEPTHS} from "./depths";

export function createStyledCountdown(scene) {

    const scale = scene.scaleValue;
    const RADIUS = scale(150);
    const STROKE_THICKNESS = Math.max(1, scale(3));
    const TITLE_FONT_SIZE = scale(32);
    const COUNTDOWN_FONT_SIZE = scale(96);
    const COUNTDOWN_STROKE = scale(4);
    const ENGAGE_FONT_SIZE = scale(64);
    const SPACING = scale(20);

    const container = scene.add.container(scene.startWidth / 2, scene.startHeight / 2)
        .setDepth(DEPTHS.UI_OVERLAY).setVisible(false).setAlpha(0);

    const background = scene.add.graphics();
    background.fillStyle(0x0A0A1A, 0.8).fillCircle(0, 0, RADIUS);
    background.lineStyle(STROKE_THICKNESS, 0x41C6FF, 0.3).strokeCircle(0, 0, RADIUS);
    container.add(background);

    const titleText = scene.add.text(0, 0, 'GET READY', {
        fontFamily: 'Tektur', fontSize: `${TITLE_FONT_SIZE}px`, color: '#ffffff'
    }).setOrigin(0.5);

    const countdownText = scene.add.text(0, 0, '', {
        fontFamily: 'Orbitron', fontSize: `${COUNTDOWN_FONT_SIZE}px`, color: '#FFD700',
        stroke: '#000000', strokeThickness: COUNTDOWN_STROKE
    }).setOrigin(0.5);

    const engageText = scene.add.text(0, 0, 'ENGAGE!', {
        fontFamily: 'Orbitron', fontSize: `${ENGAGE_FONT_SIZE}px`, color: '#03BE61'
    }).setOrigin(0.5).setVisible(false);

    const totalContentHeight = titleText.height + SPACING + countdownText.height;
    const topY = -totalContentHeight / 2;
    titleText.y = topY + titleText.height / 2;
    countdownText.y = topY + titleText.height + SPACING + countdownText.height / 2;
    engageText.y = countdownText.y;
    container.add([titleText, countdownText, engageText]);

    const hide = () => {

        scene.tweens.killTweensOf([countdownText, engageText, container]);

        countdownText.setVisible(false);
        engageText.setVisible(true).setAlpha(0).setScale(0.5);

        scene.tweens.add({
            targets: engageText,
            scale: 1, alpha: 1, duration: 200, ease: 'Power2', yoyo: true, delay: 100,
            onComplete: () => {
                scene.tweens.add({
                    targets: container, alpha: 0, duration: 300, ease: 'Sine.easeOut',
                    onComplete: () => {
                        container.setVisible(false);
                    }
                });
            }
        });
    };

    const start = (durationSeconds) => {
        countdownText.setText(durationSeconds.toString()).setVisible(true);
        engageText.setVisible(false);

        container.setVisible(true);
        scene.tweens.add({targets: container, alpha: 1, duration: 500, ease: 'Sine.easeIn'});

        scene.tweens.add({
            targets: countdownText,
            scale: {from: 1.5, to: 1}, alpha: {from: 0.5, to: 1},
            duration: 300, ease: 'Power2'
        });
    };

    const updateNumber = (newTime) => {

        if (countdownText.text === newTime.toString()) return;

        countdownText.setText(newTime.toString());
        scene.tweens.add({
            targets: countdownText,
            scale: {from: 1.5, to: 1}, alpha: {from: 0.5, to: 1},
            duration: 300, ease: 'Power2'
        });
    };

    const destroy = () => {
        scene.tweens.killTweensOf([container, countdownText, engageText]);
        container.destroy();
    };

    return {
        start,
        updateNumber,
        hide,
        destroy,
        container
    };

}