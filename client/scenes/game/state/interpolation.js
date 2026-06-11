import Phaser from 'phaser';

/**
 * Универсальная функция для интерполяции позиций и скоростей группы сетевых объектов.
 * @param {Phaser.Scene} scene - Текущая игровая сцена.
 * @param {Map<number, Phaser.Physics.Arcade.Sprite>} objectsMap - Карта активных спрайтов (враги, пули и т.д.).
 * @param {Map<number, object[]>} buffersMap - Карта буферов состояний для этих объектов.
 * @param {object} config - Объект с настройками интерполяции.
 * @param {number} config.RENDER_DELAY_MS - Задержка рендеринга в мс.
 * @param {number} config.CORRECTION_FACTOR - Сила "подруливания" к идеальной траектории.
 * @param {number} config.SNAP_THRESHOLD - Порог в пикселях для мгновенной телепортации.
 * @param {object} [debugConfig] - Необязательные настройки для отладочной графики.
 */
export function interpolateObjects(scene, objectsMap, buffersMap, config, debugConfig) {

    const serverTimeNow = Date.now() - (scene.timeOffset || 0);
    const renderTimestamp = serverTimeNow - config.RENDER_DELAY_MS;

    objectsMap.forEach((sprite, id) => {
        if (!sprite.active || !sprite.body) return;

        const buffer = buffersMap.get(id);
        if (!buffer || buffer.length < 2) {
            if (sprite.body) sprite.body.setVelocity(0, 0);
            return;
        }

        let fromIndex = -1;
        for (let i = buffer.length - 1; i >= 0; i--) {
            if (buffer[i].timestamp <= renderTimestamp) {
                fromIndex = i;
                break;
            }
        }

        if (fromIndex === -1 || fromIndex >= buffer.length - 1) {
            sprite.body.velocity.lerp(Phaser.Math.Vector2.ZERO, 0.1);
            return;
        }

        const snapshotFrom = buffer[fromIndex];
        const snapshotTo = buffer[fromIndex + 1];

        const timeTotal = snapshotTo.timestamp - snapshotFrom.timestamp;
        const timePassed = renderTimestamp - snapshotFrom.timestamp;
        const factor = (timeTotal > 0) ? Math.min(1.0, timePassed / timeTotal) : 1.0;

        const targetX = Phaser.Math.Linear(snapshotFrom.x, snapshotTo.x, factor);
        const targetY = Phaser.Math.Linear(snapshotFrom.y, snapshotTo.y, factor);
        const targetVx = Phaser.Math.Linear(snapshotFrom.vx, snapshotTo.vx, factor);
        const targetVy = Phaser.Math.Linear(snapshotFrom.vy, snapshotTo.vy, factor);

        if (snapshotFrom.rotation !== undefined && snapshotTo.rotation !== undefined) {
            const fromRotation = snapshotFrom.rotation / 100.0;
            const toRotation = snapshotTo.rotation / 100.0;

            const shortestAngle = Phaser.Math.Angle.ShortestBetween(fromRotation, toRotation);
            const targetRotation = fromRotation + shortestAngle * factor;
            sprite.setRotation(targetRotation);
        }

        const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, targetX, targetY);

        if (distance > config.SNAP_THRESHOLD) {
            sprite.setPosition(targetX, targetY);
            sprite.body.reset(targetX, targetY);
            sprite.body.setVelocity(targetVx, targetVy);
        } else {
            const errorX = targetX - sprite.x;
            const errorY = targetY - sprite.y;

            const correctionVx = errorX * config.CORRECTION_FACTOR;
            const correctionVy = errorY * config.CORRECTION_FACTOR;

            const finalVx = targetVx + correctionVx;
            const finalVy = targetVy + correctionVy;

            sprite.body.setVelocity(finalVx, finalVy);
        }

        if (scene.debugGraphics && debugConfig) {
            scene.debugGraphics.fillStyle(debugConfig.targetColor, debugConfig.targetAlpha).fillCircle(targetX, targetY, debugConfig.targetRadius);
            scene.debugGraphics.fillStyle(debugConfig.spriteColor, debugConfig.spriteAlpha).fillCircle(sprite.x, sprite.y, debugConfig.spriteRadius);
        }
    });
}