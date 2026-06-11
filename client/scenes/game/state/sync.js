import {GSK} from '../../core/gameStateKeys';
import {syncPlayer} from './playerSync';
import {syncEnemies} from './enemySync';
import {syncBullets} from './bulletSync';
import {updateHud} from '../ui/hud';
import {syncPowerups} from './powerupSync';

export function handleServerState(serverState, serverTimestamp) {

    if (!this.isPlayerReady) {

        return;
    }

    const playerState = serverState[GSK.PLAYER];
    const newEnemies = serverState[GSK.NEW_ENEMIES];
    const updatedEnemies = serverState[GSK.UPDATED_ENEMIES];
    const destroyedEnemyIds = serverState[GSK.DESTROYED_ENEMIES];
    const newBullets = serverState[GSK.NEW_BULLETS];
    const updatedBullets = serverState[GSK.UPDATED_BULLETS];
    const destroyedBulletIds = serverState[GSK.DESTROYED_BULLETS];
    const newPowerUps = serverState[GSK.NEW_POWERUPS];
    const destroyedPowerUpIds = serverState[GSK.DESTROYED_POWERUPS];

    if (playerState) {
        syncPlayer(this, playerState);
    }

    syncEnemies(this, newEnemies, updatedEnemies, destroyedEnemyIds, serverTimestamp);
    syncBullets(this, newBullets, updatedBullets, destroyedBulletIds, serverTimestamp);
    syncPowerups(this, newPowerUps, destroyedPowerUpIds);
    updateHud(this.hud, serverState);

}