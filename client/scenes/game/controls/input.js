import {CONFIG} from '../../core/config';
import {encode} from '@msgpack/msgpack';
import {CAK, CMT} from '../../core/gameStateKeys';

export function setupInput(scene) {
    scene.keys = scene.input.keyboard.addKeys({
        up: 'W', down: 'S', left: 'A', right: 'D', fire: 'SPACE', back: 'ESC', endGameRequest: 'Q', switchWeapon: 'TAB'
    });
    scene.gameState = 'preparation';
    scene.lastSentTime = 0;
    scene.localBulletIdCounter = 0;
    scene.actionIdCounter = scene.actionIdCounter || 0;
    scene.accumulatedTime = 0;
    scene.lastPosition = {x: null, y: null};
    scene.isForfeiting = false;
}

export function handleInput(scene, deltaSec) {

    if (Phaser.Input.Keyboard.JustDown(scene.keys.back) && !scene.isForfeiting) {

        if (scene.gameState === 'active' || scene.gameState === 'preparation' || scene.gameState === 'paused') {
            if (scene.ws && scene.ws.readyState === WebSocket.OPEN) {
                console.log('[Input] ESC pressed. Sending forfeit request to server.');
                scene.isForfeiting = true;
                scene.ws.send(encode([CMT.FORFEIT_REQUEST]));
            } else {

                scene.returnToHangar();
            }
        }
        return;
    }

    if (Phaser.Input.Keyboard.JustDown(scene.keys.endGameRequest)) {

        if (scene.gameState === 'paused') {
            if (scene.ws && scene.ws.readyState === WebSocket.OPEN) {
                console.log('Key Q pressed during post-boss delay, handled by postBossTimer.');
            }
        }
    }

    if (!scene.ws || scene.ws.readyState !== WebSocket.OPEN) {
        if (scene.usedActions.length > 0) {

            scene.usedActions.forEach(actionArray => {
                scene.poolManager.despawn('playerActions', actionArray);
            });
            scene.usedActions.length = 0;
        }

        scene.accumulatedTime = 0;
        return;
    }

    const now = Date.now() - (scene.timeOffset || 0);
    const position = scene.playerShip?.sprite ? {x: scene.playerShip.sprite.x, y: scene.playerShip.sprite.y} : {
        x: 0,
        y: 0
    };

    if (scene.lastPosition.x === null || position.x !== scene.lastPosition.x || position.y !== scene.lastPosition.y) {

        const playerActionArray = scene.poolManager.spawn('playerActions');
        if (playerActionArray) {

            playerActionArray[CAK.X_COORD] = position.x;
            playerActionArray[CAK.Y_COORD] = position.y;
            playerActionArray[CAK.TIMESTAMP] = now;
            playerActionArray[CAK.ACTION_ID] = scene.actionIdCounter++;
            playerActionArray[CAK.FIRE] = null;

            scene.usedActions.push(playerActionArray);
            scene.lastPosition.x = position.x;
            scene.lastPosition.y = position.y;
        }
    }

    scene.accumulatedTime += deltaSec * 1000;
    const sendInterval = CONFIG.gameplay.INPUT_SEND_INTERVAL_MS;

    if (scene.accumulatedTime >= sendInterval) {
        if (scene.usedActions.length > 0) {
            try {
                const message = [CMT.PLAYER_ACTIONS, scene.usedActions];
                scene.ws.send(encode(message));

                scene.usedActions.forEach(actionArray => {
                    scene.poolManager.despawn('playerActions', actionArray);
                });
                scene.usedActions.length = 0;

            } catch (error) {
                console.error(`Failed to send player-actions:`, error);
            }
        }
        scene.accumulatedTime -= sendInterval;
        scene.lastSentTime = now;
    }
}