import {soundManager} from '../shared/SoundManager.js';
import {stopBuffExpirationChecker} from '../shared/BuffService.js';
import {webSocketManager} from './WebSocketManager.js';

/**
 * Выполняет полную очистку всех ресурсов, таймеров и слушателей,
 * созданных HangarScene.
 * 'this' - это контекст сцены.
 */
export function cleanUpHangarScene() {
    console.log('%c--- cleanUpHangarScene() EXECUTED ---', 'color: white; background: blue; font-size: 18px;');

    webSocketManager.disconnect();

    if (this.handleNewMail) {
        webSocketManager.off('new-mail', this.handleNewMail);
    }
    if (this.handleExpUpdate) {
        webSocketManager.off('actual-exp', this.handleExpUpdate);
    }
    if (this.handleConnectionReplaced) {
        webSocketManager.off('connection-replaced', this.handleConnectionReplaced);
    }

    stopBuffExpirationChecker();

    soundManager.stopAll();
    if (this.tweens) {
        this.tweens.killAll();
    }

    if (this.scale) {
        if (this.resizeHandler) {
            this.scale.off('resize', this.resizeHandler);
        }
        this.scale.off('fullscreenchange');
    }
    if (this.events) {
        this.events.off('ui-resize');
    }
    if (this.expUpdateHandler) {
        this.events.off('exp-updated', this.expUpdateHandler);
    }

    if (this.input) {
        this.input.off('pointermove');
        this.input.off('pointerup');
        this.input.off('wheel');
        if (this.input.keyboard) {
            this.input.keyboard.off('keydown');
        }
    }

    if (this.sidePanelManager) {
        this.sidePanelManager.destroy();
        this.sidePanelManager = null;
    }
    if (this.modalManager) {
        this.modalManager.destroy();
        this.modalManager = null;
    }

    if (this.textures.exists('projection_disc_glow')) {
        this.textures.remove('projection_disc_glow');
        console.log('Dynamic texture "projection_disc_glow" removed.');
    }
}

/**
 * Аварийное завершение работы сцены.
 * 'this' - это контекст сцены.
 */
export function destroyOnError() {
    console.log('%c--- destroyOnError() TRIGGERED ---', 'color: red; font-weight: bold;');

    cleanUpHangarScene.call(this);

    if (this.children) {
        this.children.removeAll(true);
    }

    this.scene.stop();
    this.scene.remove();

}