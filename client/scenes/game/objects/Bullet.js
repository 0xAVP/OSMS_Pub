import Phaser from 'phaser';
import {DEPTHS} from "../ui/depths";

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.id = '';
        this.bulletType = '';
        this.poolKey = '';
    }

    /**
     * Инициализирует пулю при её создании в пуле.
     * @param {object} bulletConfig - Конфигурация из BULLETS.js.
     * @param {string} poolKey - Ключ пула, в который будет возвращена пуля.
     */
    init(bulletConfig, poolKey) {
        this.poolKey = poolKey;
        this.body.setAllowGravity(false);

        if (bulletConfig.type === 'animation' && this.scene.anims.exists(bulletConfig.animKey)) {
            this.play(bulletConfig.animKey, true);
        }

        if (bulletConfig.type === 'image' && bulletConfig.angularSpeed) {
            const rotationTween = this.scene.tweens.add({
                targets: this,
                angle: '+=360',
                duration: (360 / bulletConfig.angularSpeed) * 1000,
                repeat: -1,
                ease: 'Linear',
                paused: true
            });
            this.setData('rotationTween', rotationTween);
        }
    }

    /**
     * "Выстреливает" пулю, настраивая её визуал и физику.
     * @param {object} params - Параметры выстрела.
     */
    fire(params) {
        const {uniqueId, x, y, velocityX, velocityY, scaleX, scaleY, bulletConfig} = params;

        this.id = uniqueId;
        this.setTexture(bulletConfig.texture);

        this.stop();
        if (bulletConfig.type === 'animation') {
            this.play(bulletConfig.animKey);
        } else if (bulletConfig.type === 'image' && bulletConfig.angularSpeed) {
            const tween = this.getData('rotationTween');
            if (tween && tween.isPaused()) tween.resume();
        }

        this.setPosition(x, y);
        this.setScale(scaleX, scaleY);

        const newDepth = bulletConfig.depth ?? DEPTHS.PLAYER_BULLET;
        this.setActive(true).setVisible(true).setDepth(newDepth);

        this.body.setEnable(true);

        this.body.setSize(this.width, this.height);

        this.body.setVelocity(velocityX, velocityY);
    }

    /**
     * Деактивирует пулю и возвращает её в PoolManager.
     */
    deactivate() {
        if (!this.active) return;

        const tween = this.getData('rotationTween');
        if (tween && tween.isPlaying()) {
            tween.pause();
        }

        if (this.hitEnemies) {
            this.hitEnemies.clear();
        }

        if (this.body) {
            this.body.setEnable(false);
            this.body.setVelocity(0, 0);
        }

        this.scene.poolManager.despawn(this.poolKey, this);
    }
}