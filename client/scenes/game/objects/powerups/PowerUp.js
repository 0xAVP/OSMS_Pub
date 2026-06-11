import Phaser from 'phaser';
import {DEPTHS} from "../../ui/depths";

/**
 * Класс, представляющий один объект-паверап на игровой сцене.
 * Управляется через PoolManager.
 */
export class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.id = null;
        this.typeId = null;
        this.poolKey = '';
    }

    /**
     * Инициализирует паверап при создании в пуле.
     * @param {string} poolKey - Ключ пула, к которому принадлежит этот объект.
     */
    init(poolKey) {
        this.poolKey = poolKey;

        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
    }

    /**
     * "Активирует" паверап, делая его видимым и активным в указанной позиции.
     * @param {object} params - Параметры для активации.
     * @param {number} params.id - Уникальный ID от сервера.
     * @param {string} params.typeId - Тип паверапа.
     * @param {number} params.x - Координата X.
     * @param {number} params.y - Координата Y.
     * @param {string} params.texture - Ключ текстуры для отрисовки.
     * @param {number} params.scale - Масштаб для спрайта.
     */
    activate({id, typeId, x, y, texture, scale}) {
        this.id = id;
        this.typeId = typeId;

        this.setTexture(texture);
        this.setScale(scale);
        this.setPosition(x, y);
        this.setDepth(DEPTHS.POWERUPS);

        this.setActive(true).setVisible(true);
        this.body.setEnable(true);

        this.body.setSize(this.width, this.height);

        this.scene.tweens.add({
            targets: this,
            scale: scale * 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

    }

    /**
     * "Деактивирует" паверап, скрывая его и возвращая в пул.
     */
    deactivate() {
        if (!this.active) return;

        this.scene.tweens.killTweensOf(this);

        this.body.setEnable(false);
        this.setActive(false).setVisible(false);

        this.scene.poolManager.despawn(this.poolKey, this);
    }
}
