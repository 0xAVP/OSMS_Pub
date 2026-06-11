import {soundManager} from '../shared/SoundManager.js';

/**
 * Содержит всю логику ручной очистки для GameScene.
 * Ожидает, что в качестве 'this' ей будет передан экземпляр сцены.
 */
export function cleanUpGameScene() {
    console.log('%c--- GameScene.shutdown() EXECUTED ---', 'color: white; background: green; font-size: 18px;');

    soundManager.stopAll();

    try {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
    } catch (error) {
        console.error('Shutdown: Error closing WebSocket:', error);
    }

    if (this.scale) {
        this.scale.off('resize', this.updateCameraViewport, this);
        this.scale.off('fullscreenchange');
    }

    if (this.time) {
        this.time.removeAllEvents();
    }
    if (this.tweens) {
        this.tweens.killAll();
    }

    if (this.physicsOverlaps && Array.isArray(this.physicsOverlaps)) {
        this.physicsOverlaps.forEach(overlap => overlap.destroy());
        this.physicsOverlaps = [];
    }

    if (this.playerShip && typeof this.playerShip.destroy === 'function') {
        this.playerShip.destroy();
        this.playerShip = null;
    }
    if (this.hud && typeof this.hud.destroy === 'function') {
        this.hud.destroy();
        this.hud = null;
    }
    if (this.styledCountdown && typeof this.styledCountdown.destroy === 'function') {
        this.styledCountdown.destroy();
        this.styledCountdown = null;
    }

    if (this.backgroundLayers) {

        if (this.backgroundLayers.dynamic) {
            this.backgroundLayers.dynamic.dustEmitter?.destroy();
            this.backgroundLayers.dynamic.brightEmitter?.destroy();
            this.backgroundLayers.dynamic.pulsarEmitter?.destroy();
        }

        this.backgroundLayers.base?.destroy();
        this.backgroundLayers.hangar?.layer?.destroy();
        this.backgroundLayers.hangar?.shield?.destroy();

        this.backgroundLayers.clouds?.cloudLayers?.forEach(c => c.destroy());
        this.backgroundLayers.planets?.planetLayers?.forEach(p => p.destroy());
        this.backgroundLayers.stones?.stoneLayers?.forEach(s => s.destroy());

        this.backgroundLayers = null;
    }

    if (this.poolManager) {
        this.poolManager.destroy();
        this.poolManager = null;
    }

    if (this.enemiesMap) this.enemiesMap.clear();
    if (this.activeBulletsMap) this.activeBulletsMap.clear();
    if (this.activePlayerBulletsMap) this.activePlayerBulletsMap.clear();
    if (this.processedEnemyDestroyed) this.processedEnemyDestroyed.clear();
    if (this.enemyBulletsBuffer) this.enemyBulletsBuffer.clear();
    if (this.enemyBuffer) this.enemyBuffer.clear();
    if (this.unspawnedEnemiesData) this.unspawnedEnemiesData.clear();
    if (this.unspawnedBulletsData) this.unspawnedBulletsData.clear();

    this.usedActions = [];

    if (this.notificationTween && this.notificationTween.isPlaying()) {
        this.notificationTween.stop();
    }
    if (this.notificationTimer) {
        this.notificationTimer.remove();
    }
    if (this.notificationContainer) {
        this.notificationContainer.destroy();
    }
    this.notificationTween = null;
    this.notificationTimer = null;
    this.notificationContainer = null;

    if (this.enemiesGroup) {
        this.enemiesGroup.destroy(true);
        this.enemiesGroup = null;
    }

    this.player = null;
    this.shipConfig = null;

    console.log('%c--- GameScene.CleanUp() EXECUTED ---', 'color: white; background: green; font-size: 18px;');
}

export function checkOutOfBoundsBullets(scene) {
    const worldBounds = scene.physics.world.bounds;

    if (scene.activePlayerBulletsMap) {
        scene.activePlayerBulletsMap.forEach((bullet, bulletId) => {
            if (bullet.active && !worldBounds.contains(bullet.x, bullet.y)) {
                bullet.deactivate();
                scene.activePlayerBulletsMap.delete(bulletId);
            }
        });
    }

    if (scene.activeBulletsMap) {
        scene.activeBulletsMap.forEach((bullet, bulletId) => {
            if (bullet.active && !worldBounds.contains(bullet.x, bullet.y)) {
                bullet.deactivate();
                scene.activeBulletsMap.delete(bulletId);
                scene.enemyBulletsBuffer.delete(bulletId);
            }
        });
    }
}