import Phaser from 'phaser';
import {selectTextureAndScale} from '../../../core/utils';
import {createExhaust} from '../exhausts';
import {createFloatingText} from '../../ui/floatingText';
import {handleLootDrop} from '../loot/lootHandler';
import * as VFX from './enemyVFX';
import {DEPTHS} from "../../ui/depths";
import {EnemyUI} from './EnemyUI';
import {ENEMY_TYPES} from './enemyTypes';
import {ESK} from "../../../core/gameStateKeys";
import {soundManager} from '../../../shared/SoundManager.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        super(scene, -100, -100, 'boom_ss1@1x');
        this.exhaust = null;
        this.id = null;
        this.hp = 0;
        this.maxHp = 0;
        this.collisionDamage = 0;
        this.pendingDestruction = false;

        this.ui = new EnemyUI(scene);
    }

    init() {
        this.setActive(false).setVisible(false);
    }

    activate(data) {

        const [id, typeId, x, y, hp, size, collisionDamage] = data;

        const enemyConfig = ENEMY_TYPES[typeId];
        if (!enemyConfig) {
            console.error(`Enemy config for typeId "${typeId}" not found!`);
            return;
        }

        let texture = enemyConfig.texture;
        const exhaustType = enemyConfig.exhaust;

        if (Array.isArray(texture)) {
            texture = Phaser.Utils.Array.GetRandom(texture);
        }

        this.id = id;
        this.hp = hp;
        this.maxHp = hp;
        this.collisionDamage = collisionDamage || 0;
        this.pendingDestruction = false;

        if (!enemyConfig.skipSpawnEffect) {
            VFX.playSpawnAnimation(this.scene, x, y, size[0] * 6);
        }

        this.enableBody(true, x, y, true, true);
        const {textureKey, scale: finalScale} = selectTextureAndScale(this.scene, texture, size[0]);
        const enemyDepth = enemyConfig.depth ?? DEPTHS.ENEMY;

        this.setTexture(textureKey)
            .setDepth(enemyDepth)
            .setScale(0)
            .setAlpha(0);

        this.scene.tweens.add({
            targets: this,
            scale: finalScale,
            alpha: 1,
            duration: 500,
            ease: 'Sine.easeOut'
        });

        const hitboxWidthReduction = 0.2;
        const newHitboxWidth = this.width * (1 - hitboxWidthReduction);
        const newHitboxHeight = this.height;

        const newOffsetX = this.width * hitboxWidthReduction;

        this.body.setSize(newHitboxWidth, newHitboxHeight);
        this.body.setOffset(newOffsetX, 0);

        this.setData('enemySize', {width: size[0], height: size[1]});

        if (exhaustType) {
            this.exhaust = createExhaust(this.scene, this, exhaustType, true);
        }

        this.ui.show(this, {width: size[0], height: size[1]});
    }

    deactivate() {
        if (this.pendingDestruction) return;
        this.pendingDestruction = true;

        this.scene.tweens.killTweensOf(this);
        this.clearTint();
        this.setRotation(0);

        if (this.exhaust) {
            this.scene.poolManager.despawn('exhausts', this.exhaust);
            this.exhaust = null;
        }

        this.ui.hide();

        this.disableBody(true, true);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.active || this.pendingDestruction) return;

        if (this.exhaust) {

            this.exhaust.setRotation(this.rotation);

            const offsetDistance = this.displayWidth / 2;

            const exhaustX = this.x + Math.cos(this.rotation) * offsetDistance;
            const exhaustY = this.y + Math.sin(this.rotation) * offsetDistance;

            this.exhaust.setPosition(exhaustX, exhaustY);

            /* СТАРЫЙ КОД БЫЛ ТАКОЙ:
            const offsetX = this.displayWidth / 2;
            this.exhaust.setPosition(this.x + offsetX, this.y);
            */
        }

        if (this.ui) {
            this.ui.update(this);
        }
    }

    updateState(delta) {
        if (!this.active) return;

        if (delta[ESK.HP] !== undefined) {
            this.hp = delta[ESK.HP];
        }

    }

    takeHit(bullet) {
        soundManager.playSfx('enemy_damaged1');

        VFX.playHitEffect(this.scene, bullet.x, bullet.y);
    }

    quietDestroy() {
        if (this.pendingDestruction) return;
        VFX.playDeathAnimation(this.scene, this);
        this.deactivate();
    }

    explodeAndDestroy(loot) {
        if (this.pendingDestruction) return;
        soundManager.playSfx('explosion_sound1');

        handleLootDrop(this.scene, loot, this.x, this.y);
        VFX.playDeathAnimation(this.scene, this, {implode: true});
        VFX.playExplosion(this.scene, this.x, this.y, this.displayWidth * 3);
        this.deactivate();
    }

    playCriticalHitEffect() {

        VFX.playCritTween(this.scene, this);
    }

    playMiningEffect() {
        createFloatingText(this.scene, this.x, this.y, 'MINED', 'white');
    }
}
