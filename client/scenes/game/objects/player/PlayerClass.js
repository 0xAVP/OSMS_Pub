import Phaser from 'phaser';
import {ShipControls} from '../../controls/shipControls';
import {playerFirePatterns} from '../../controls/firePatterns';
import {encode} from '@msgpack/msgpack';
import {CMT} from "../../../core/gameStateKeys";

export class Player {
    /**
     * @param {Phaser.Scene} scene The Phaser scene.
     * @param {import('./PlayerShipClass').Ship} ship The ship instance this player controls.
     */
    constructor(scene, ship) {
        this.scene = scene;
        this.ship = ship;

        this.lastFireTime = 0;
        this.idleFloatTime = 0;
        this.anchorY = 0;
        this.isIdleFloating = false;
        this.isSwitchingWeapon = false;
        this.weaponSwitchOnCooldown = false;
        this.ignoreEnergyUpdateUntil = 0;

        this.keys = this.scene.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D', fire: 'SPACE', switchWeapon: 'TAB'
        });
    }

    /**
     * Основной метод обновления, вызываемый из игрового цикла сцены.
     * @param {number} deltaSec Дельта времени в секундах.
     */
    update(deltaSec) {

        if (this.scene.gameState !== 'active') {
            if (this.ship.sprite && this.ship.sprite.body) {
                this.ship.sprite.body.setVelocity(0, 0);
            }
            return;
        }

        this._handleMovement(deltaSec);
        this._handleActions();
    }

    /**
     * Обрабатывает движение и состояние покоя корабля.
     * @param {number} deltaSec
     * @private
     */
    _handleMovement(deltaSec) {
        const sprite = this.ship.sprite;
        const direction = {
            up: this.keys.up.isDown,
            down: this.keys.down.isDown,
            left: this.keys.left.isDown,
            right: this.keys.right.isDown
        };
        const isMoving = (direction.up || direction.down || direction.left || direction.right);

        ShipControls.updateShipAngle(sprite, direction);

        if (isMoving) {
            this.isIdleFloating = false;
            ShipControls.applyPlayerMovement(sprite, this.ship.config, direction, deltaSec);
        } else {
            if (!this.isIdleFloating) {
                this.isIdleFloating = true;
                this.anchorY = sprite.y;
                this.idleFloatTime = 0;
                sprite.body.setVelocity(0, 0);
            }
            this.idleFloatTime += deltaSec;
            const floatAmplitude = 4;
            const floatSpeed = 1.5;
            const yOffset = Math.sin(this.idleFloatTime * floatSpeed) * floatAmplitude;
            sprite.y = this.anchorY + yOffset;
        }
    }

    /**
     * Обрабатывает стрельбу и смену оружия.
     * @private
     */
    _handleActions() {
        const now = Date.now();
        const sprite = this.ship.sprite;
        const position = {x: sprite.x, y: sprite.y};

        const activeSlot = this.ship.activeWeaponSlot || 'weapon1';
        const activeWeapon = this.ship.config.weapon[activeSlot];

        if (activeWeapon && this.keys.fire.isDown && this.ship.energy >= activeWeapon.energyCost + 1) {
            const velocityX = sprite.body.velocity.x;
            const baseFireRate = activeWeapon.fireRate;
            const bulletSpeed = activeWeapon.bullet.speed;
            const maxShipSpeed = this.ship.config.engine.speed;
            let newFireRate = baseFireRate;

            if (bulletSpeed - velocityX !== 0) {
                newFireRate = baseFireRate * (bulletSpeed + maxShipSpeed) / (bulletSpeed - velocityX);
                newFireRate = Math.max(baseFireRate, Math.min(newFireRate, 2000));
            }

            if (now - this.lastFireTime >= newFireRate) {
                const firePattern = activeWeapon.firePattern || 'single';
                const patternHandler = playerFirePatterns[firePattern];

                if (patternHandler) {

                    patternHandler(this.scene, this.ship.sprite, activeWeapon, now, position);

                    this.lastFireTime = now;
                    const newEnergy = this.ship.energy - activeWeapon.energyCost;
                    this.ship.energy = Math.max(0, newEnergy);
                    this.ship.serverState.energy = Math.max(0, newEnergy);
                    this.ignoreEnergyUpdateUntil = now + 250;
                } else {
                    console.warn(`Unknown client fire pattern: ${firePattern}`);
                }
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.switchWeapon)) {
            const hasTwoWeapons = this.ship.config && this.ship.config.weapon && !!this.ship.config.weapon.weapon2;
            if (hasTwoWeapons && !this.isSwitchingWeapon && !this.weaponSwitchOnCooldown) {
                if (this.scene.ws && this.scene.ws.readyState === WebSocket.OPEN) {
                    this.isSwitchingWeapon = true;
                    this.scene.ws.send(encode([CMT.REQUEST_WEAPON_SWITCH]));
                    console.log('Sent request-weapon-switch. Waiting for server confirmation...');

                    if (this.scene.hud?.skillBarContainer?.cooldownIndicator) {
                        this.scene.hud.skillBarContainer.cooldownIndicator.startCastingAnimation();
                    }
                }
            }
        }
    }
}