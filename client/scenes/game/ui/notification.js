import Phaser from 'phaser';

/**
 * Показывает на экране стилизованное анимированное уведомление.
 * Если уведомление уже активно, оно обновит свой текст и перезапустит анимацию.
 * @param {Phaser.Scene} scene - Текущая игровая сцена.
 * @param {string} message - Текст для отображения.
 * @param {boolean} [isSticky=false] - Если true, уведомление останется на экране до следующего вызова showNotification.
 */
export function showNotification(scene, message, isSticky = false) {
    try {
        if (!message || typeof message !== 'string') {
            throw new Error(`Invalid notification message: ${message}`);
        }

        const scale = scene.scaleValue;
        const BAR_WIDTH = scale(500);
        const BAR_HEIGHT = scale(50);
        const CORNER_CUT = scale(25);
        const ON_SCREEN_Y = scale(60);
        const OFF_SCREEN_Y = -scale(100);
        const FONT_SIZE = scale(20);
        const STROKE_THICKNESS = Math.max(1, scale(2));

        const DISPLAY_DURATION = 3500;
        const ANIMATION_DURATION = 400;

        if (!scene.notificationContainer) {
            scene.notificationContainer = scene.add.container(scene.startWidth / 2, OFF_SCREEN_Y).setDepth(1000);
            const background = scene.add.graphics();
            background.fillStyle(0x0A0A1A, 0.3);
            background.lineStyle(STROKE_THICKNESS, 0x41C6FF, 0.3);

            background.beginPath();
            background.moveTo(-BAR_WIDTH / 2, 0);
            background.lineTo(BAR_WIDTH / 2 - CORNER_CUT, 0);
            background.lineTo(BAR_WIDTH / 2, BAR_HEIGHT - CORNER_CUT);
            background.lineTo(BAR_WIDTH / 2, BAR_HEIGHT);
            background.lineTo(-BAR_WIDTH / 2, BAR_HEIGHT);
            background.closePath();
            background.fillPath();
            background.strokePath();

            scene.notificationText = scene.add.text(0, BAR_HEIGHT / 2, '', {
                fontFamily: 'Orbitron',
                fontSize: `${FONT_SIZE}px`,
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);

            scene.notificationContainer.add([background, scene.notificationText]);
            scene.notificationTween = null;

        }

        const container = scene.notificationContainer;

        scene.notificationText.setText(message);

        if (scene.notificationTween && scene.notificationTween.isPlaying()) {
            scene.notificationTween.stop();
            scene.notificationTween = null;
        }

        if (scene.notificationTimer) {
            scene.notificationTimer.remove();
            scene.notificationTimer = null;
        }

        container.setVisible(true);
        container.setAlpha(1);

        const tweenConfig = {
            targets: container,
            y: ON_SCREEN_Y,
            duration: container.y < ON_SCREEN_Y ? ANIMATION_DURATION : 200,
            ease: 'Sine.easeOut'
        };

        if (isSticky === false) {

            tweenConfig.onComplete = () => {
                scene.notificationTimer = scene.time.delayedCall(DISPLAY_DURATION, () => {
                    scene.notificationTween = scene.tweens.add({
                        targets: container,
                        y: OFF_SCREEN_Y,
                        duration: ANIMATION_DURATION,
                        ease: 'Sine.easeIn',
                        onComplete: () => {
                            container.setVisible(false);
                            scene.notificationTween = null;
                        }
                    });
                });
            };
        } else {

            scene.notificationTween = null;
        }

        scene.notificationTween = scene.tweens.add(tweenConfig);

    } catch (error) {
        console.error(`Failed to show notification: ${error.message}`);

        if (scene) {
            if (scene.notificationTween) scene.notificationTween.stop();
            scene.notificationTween = null;
            if (scene.notificationTimer) scene.notificationTimer.remove();
            scene.notificationTimer = null;
            if (scene.notificationContainer) scene.notificationContainer.setVisible(false);
        }
    }
}