import Phaser from 'phaser';
import {createExhaust} from '../exhausts';
import {selectTextureAndScale} from '../../../core/utils';
import {CONFIG} from '../../../core/config';
import {Utils} from '../../../core/utils';
import {createFloatingText} from '../../ui/floatingText.js';
import {PSK} from '../../../core/gameStateKeys';
import {DEPTHS} from "../../ui/depths";

export class Ship {
    constructor(scene, x, y, shipConfig) {
        this.scene = scene;
        this.config = shipConfig;

        const textureKeyWithPrefix = `game_${this.config.name}`;
        const {textureKey, scale} = selectTextureAndScale(scene, textureKeyWithPrefix, this.config.shipSize.width);

        this.sprite = scene.physics.add.sprite(x, y, textureKey)
            .setScale(scale)
            .setDrag(1)
            .setCollideWorldBounds(true)
            .setDepth(DEPTHS.PLAYER)

        this.shieldSprite = scene.add.sprite(x, y, 'ship_shield')
            .setOrigin(0.5, 0.5)
            .setAlpha(0.2)
            .setDepth(DEPTHS.PLAYER_SHIELD)
            .setVisible(true);
        const shieldScale = (this.config.shipSize.width * 1.3) / this.shieldSprite.width;
        this.shieldSprite.setScale(shieldScale);

        const initialData = scene.initialShipData;
        const maxShield = initialData.modules.shield.module.params.shield.capacity;
        const maxArmor = initialData.modules.armor.module.params.armor.capacity;
        const maxHull = initialData.hull;
        const maxEnergy = initialData.modules.engine.module.params.energy.capacity;

        this.shield = maxShield;
        this.armor = maxArmor;
        this.hull = maxHull;
        this.energy = maxEnergy;
        this.activeWeaponSlot = 'weapon1';

        this.serverState = {
            x: x,
            y: y,
            shield: maxShield,
            energy: maxEnergy
        };

        this.exhaustEmitter = null;
        this.impactEmitter = null;
        this.lastCorrectionTime = 0;

        scene.time.delayedCall(100, () => {
            this.exhaustEmitter = createExhaust(scene, this.sprite, 1);
            this._createImpactEmitter();
        });
    }

    /**
     * Приватный метод для создания эмиттера частиц потока
     * @private
     */
    _createImpactEmitter() {
        if (!this.scene.textures.exists('impact_particle')) {
            const graphics = this.scene.make.graphics();
            graphics.fillStyle(0xffffff, 0.7);
            graphics.fillCircle(2, 2, 1.5);
            graphics.generateTexture('impact_particle', 4, 4);
            graphics.destroy();
        }

        const flowZone = {
            getRandomPoint: (point) => {
                const angle = Phaser.Math.Between(-90, 90);
                const radius = this.config.shipSize.width / 2 + 5;
                point.x = radius * Math.cos(Phaser.Math.DegToRad(angle));
                point.y = radius * Math.sin(Phaser.Math.DegToRad(angle));
                return point;
            }
        };

        this.impactEmitter = this.scene.add.particles(0, 0, 'impact_particle', {
            emitZone: {source: flowZone, type: 'random'},
            frequency: 20,
            quantity: 1,
            speedY: {min: -50, max: 50},
            speedX: {min: -150, max: -50},
            lifespan: {min: 200, max: 500},
            scale: {start: 0.7, end: 0},
            alpha: {start: 0.8, end: 0},
            blendMode: 'ADD',
            on: false
        }).setDepth(DEPTHS.PLAYER_SHIELD + 0.1)
    }

    update(deltaSec) {
        if (!this.sprite || !this.sprite.body) return;

        this.shield = Utils.lerp(this.shield, this.serverState.shield, CONFIG.gameplay.player.ENERGY_LERP_FACTOR);
        this.energy = Utils.lerp(this.energy, this.serverState.energy, CONFIG.gameplay.player.ENERGY_LERP_FACTOR);

        this.shieldSprite.setPosition(this.sprite.x, this.sprite.y);

        if (this.exhaustEmitter) {
            const offsetX = -(this.sprite.displayWidth / 2);
            this.exhaustEmitter.setPosition(this.sprite.x + offsetX, this.sprite.y);
        }

        if (this.impactEmitter) {
            this.impactEmitter.setPosition(this.sprite.x, this.sprite.y);
            const velocityX = this.sprite.body.velocity.x;
            const isMovingForward = velocityX > 1;

            if (isMovingForward && !this.impactEmitter.emitting) {
                this.impactEmitter.start();
            } else if (!isMovingForward && this.impactEmitter.emitting) {
                this.impactEmitter.stop();
            }
        }
    }

    applyState(serverPlayerState, ignoreEnergyUpdateUntil) {
        const now = Date.now();

        if (serverPlayerState[PSK.SHIELD] !== undefined) {
            this.serverState.shield = serverPlayerState[PSK.SHIELD];
        }
        if (serverPlayerState[PSK.ARMOR] !== undefined) {
            this.armor = serverPlayerState[PSK.ARMOR];
        }
        if (serverPlayerState[PSK.HULL] !== undefined) {
            this.hull = serverPlayerState[PSK.HULL];
        }
        if (serverPlayerState[PSK.ENERGY] !== undefined) {
            const serverEnergy = serverPlayerState[PSK.ENERGY];

            if (now > ignoreEnergyUpdateUntil) {

                this.serverState.energy = serverEnergy;
            } else {

                if (serverEnergy > this.serverState.energy) {
                    this.serverState.energy = serverEnergy;

                    if (this.energy < this.serverState.energy) {
                        this.energy = this.serverState.energy;
                    }
                }
            }
        }
        if (serverPlayerState[PSK.ACTIVE_WEAPON_SLOT] !== undefined) {
            this.activeWeaponSlot = serverPlayerState[PSK.ACTIVE_WEAPON_SLOT];
        }
    }

    blinkShield() {
        if (!this.shieldSprite || !this.shieldSprite.visible) {
            console.warn('Shield sprite not available or not visible, skipping blink animation');
            return;
        }

        this.scene.tweens.add({
            targets: this.shieldSprite,
            alpha: {from: 0.2, to: 1},
            duration: 150,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.shieldSprite.setAlpha(0.2);
            }
        });
    }

    playEvasionEffect() {
        if (!this.sprite || !this.scene) return;

        console.log('[CLIENT] EVASION! Ship evaded an attack.');

        const yOffset = this.scene.scaleValue(30);
        createFloatingText(this.scene, this.sprite.x, this.sprite.y - yOffset, 'EVADE!', 'cyan');

        const ghost = this.scene.add.sprite(this.sprite.x, this.sprite.y, this.sprite.texture.key)
            .setOrigin(this.sprite.originX, this.sprite.originY)
            .setScale(this.sprite.scale)
            .setAngle(this.sprite.angle)
            .setDepth(this.sprite.depth - 1)
            .setAlpha(0.5);

        this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: 300,
            ease: 'Power1',
            onComplete: () => {
                ghost.destroy();
            }
        });

    }

    /**
     * Воспроизводит эффект поглощения урона (Absorption).
     * @param {number} absorbedAmount - Количество поглощенного урона.
     * Вызывается из messageHandler при получении события 'player-absorb-feedback'.
     */
    playAbsorptionEffect(absorbedAmount) {
        if (!this.sprite || !this.scene) return;

        console.log(`[CLIENT] ABSORPTION! Ship armor absorbed ${absorbedAmount} damage.`);

        const roundedAmount = Math.floor(absorbedAmount);
        const yOffset = this.scene.scaleValue(30);
        createFloatingText(this.scene, this.sprite.x, this.sprite.y - yOffset, `ABSORB -${roundedAmount}`, 'orange');

        this.scene.tweens.add({
            targets: this.sprite,
            tint: 0xffa500,
            duration: 150,
            yoyo: true,
            repeat: 1,
            onComplete: () => {

                if (this.sprite) {
                    this.sprite.clearTint();
                }
            }
        });

        const particles = this.scene.add.particles(0, 0, 'circle_particle', {
            x: this.sprite.x,
            y: this.sprite.y,
            speed: {min: 50, max: 120},
            scale: {start: 0.8, end: 0},
            alpha: {start: 0.8, end: 0},
            lifespan: 400,
            tint: 0xffa500,
            blendMode: 'ADD',
            emitting: false
        });

        particles.setDepth(101);

        particles.explode(15);

        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
    }

    playPowerUpEffect(tint = 0xffffff) {
        if (!this.sprite || !this.scene || !this.shieldSprite) return;

        const radius = this.shieldSprite.displayWidth / 2 * 0.9;
        const duration = 1500;
        const numParticles = 3;

        const particles = [];

        for (let i = 0; i < numParticles; i++) {
            const particle = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'circle_particle')
                .setTint(tint)
                .setAlpha(0)
                .setScale(0)
                .setDepth(this.shieldSprite.depth + 0.1);
            particles.push(particle);
        }

        this.scene.tweens.addCounter({
            from: 0,
            to: 360,
            duration: duration,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const angleDeg = tween.getValue();
                const progress = tween.progress;

                const alpha = Math.sin(progress * Math.PI);
                const scale = alpha * 0.8;

                particles.forEach((particle, i) => {

                    const particleAngleRad = Phaser.Math.DegToRad(angleDeg + (i * 360 / numParticles));

                    particle.x = this.sprite.x + radius * Math.cos(particleAngleRad);
                    particle.y = this.sprite.y + radius * Math.sin(particleAngleRad);
                    particle.setAlpha(alpha);
                    particle.setScale(scale);
                });
            },
            onComplete: () => {

                particles.forEach(p => p.destroy());
            }
        });
    }

    /**
     * Уничтожает все связанные с кораблем объекты.
     */
    destroy() {
        this.sprite.destroy();
        this.shieldSprite.destroy();
        if (this.exhaustEmitter) this.exhaustEmitter.destroy();
        if (this.impactEmitter) this.impactEmitter.destroy();
    }
}