export class EnemyUI {
    constructor(scene) {
        this.scene = scene;
        this.healthBar = null;
        this.threatIndicator = null;
    }

    show(enemy, size) {
        const healthBarY = enemy.y - (size.height / 2) - 10;
        const indicatorY = healthBarY - 10;

        this.healthBar = this.scene.poolManager.spawn('healthBars');
        if (this.healthBar) {
            const finalWidth = size.width;
            this.healthBar.resize(finalWidth * 0.8);
            this.healthBar.container.setPosition(enemy.x, healthBarY);

            this.healthBar.container.setAlpha(0).setVisible(true);
            this.scene.tweens.add({
                targets: this.healthBar.container,
                alpha: 1,
                duration: 1000,
                ease: 'Sine.easeOut'
            });

        }

        this.threatIndicator = this.scene.poolManager.spawn('collisionDisplays');
        if (this.threatIndicator) {
            const isDeadly = enemy.collisionDamage === Number.MAX_SAFE_INTEGER;
            this.threatIndicator.setState(isDeadly, enemy.collisionDamage);
            this.threatIndicator.container.setPosition(enemy.x, indicatorY);

            this.threatIndicator.container.setAlpha(0).setVisible(true);
            this.scene.tweens.add({
                targets: this.threatIndicator.container,
                alpha: 1,
                duration: 1000,
                ease: 'Sine.easeOut'
            });

        }
    }

    hide() {
        if (this.healthBar) {

            this.scene.tweens.killTweensOf(this.healthBar.container);
            this.healthBar.container.setVisible(false);
            this.scene.poolManager.despawn('healthBars', this.healthBar);
            this.healthBar = null;
        }
        if (this.threatIndicator) {

            this.scene.tweens.killTweensOf(this.threatIndicator.container);
            this.threatIndicator.container.setVisible(false);
            this.scene.poolManager.despawn('collisionDisplays', this.threatIndicator);
            this.threatIndicator = null;
        }
    }

    update(enemy) {
        if (!enemy.visible) {
            this.hide();
            return;
        }

        const healthBarY = enemy.y - (enemy.displayHeight / 2) - 10;

        if (this.healthBar) {
            this.healthBar.container.setPosition(enemy.x, healthBarY);
            this.healthBar.update(enemy.hp, enemy.maxHp);
        }

        if (this.threatIndicator) {
            const indicatorY = healthBarY - 10;
            this.threatIndicator.container.setPosition(enemy.x, indicatorY);
        }
    }
}