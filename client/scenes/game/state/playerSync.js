export function syncPlayer(scene, playerState) {
    if (!scene.playerShip || !scene.playerShip.sprite) {
        console.error('Player ship is missing, skipping sync');
        return;
    }

    const previousWeaponSlot = scene.playerShip.activeWeaponSlot;

    scene.playerShip.applyState(playerState, scene.player.ignoreEnergyUpdateUntil);

    if (scene.player.isSwitchingWeapon && previousWeaponSlot !== scene.playerShip.activeWeaponSlot) {
        console.log(`Weapon switch confirmed by server: ${previousWeaponSlot} -> ${scene.playerShip.activeWeaponSlot}`);

        scene.player.isSwitchingWeapon = false;
        scene.player.weaponSwitchOnCooldown = true;

        if (scene.hud?.skillBarContainer?.cooldownIndicator) {
            const cooldownTime = 5000;
            scene.hud.skillBarContainer.cooldownIndicator.startAnimation(cooldownTime, () => {
                scene.player.weaponSwitchOnCooldown = false;
                console.log("Weapon switch is off cooldown.");
            });
        }
    }
}