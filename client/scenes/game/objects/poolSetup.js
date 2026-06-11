import Phaser from 'phaser';
import {selectTextureAndScale} from "../../core/utils";
import {PowerUp} from './powerups/PowerUp';
import {createHealthBar} from './enemies/healthBar';

export function initPools(scene) {

    scene.poolManager.createPool('loot', {maxSize: 100});
    scene.poolManager.createPool('explosions', {maxSize: 100});
    scene.poolManager.createPool('exhausts', {maxSize: 100});
    scene.poolManager.createPool('hitEffects', {maxSize: 100});
    scene.poolManager.createPool('visualClones', {
        classType: Phaser.GameObjects.Sprite,
        maxSize: 100
    });

    scene.poolManager.createPool('healthBars', {
        type: 'data',
        maxSize: 200,
        createCallback: () => {
            const healthBar = createHealthBar(scene, 0, 0, 50, 6);
            healthBar.container.setVisible(false);
            return healthBar;
        }
    });

    scene.poolManager.createPool('collisionDisplays', {
        type: 'data',
        maxSize: 200,
        createCallback: () => {

            const damageTextStyle = {
                fontFamily: 'Tektur',
                fontSize: '12px',
                color: '#ffae78',
                stroke: '#000000',
                strokeThickness: 2
            };
            const normalIcon = scene.add.image(0, 0, 'ic_enemy_collision');
            const damageText = scene.add.text(0, 0, '', damageTextStyle).setOrigin(0, 0.5);
            const deadlyIcon = scene.add.image(0, 0, 'ic_deadly@1x');

            const container = scene.add.container(0, 0, [normalIcon, damageText, deadlyIcon]);
            container.setVisible(false).setDepth(3);

            const setState = (isDeadly, damageValue) => {
                if (isDeadly) {
                    normalIcon.setVisible(false);
                    damageText.setVisible(false);

                    const {
                        textureKey,
                        scale
                    } = scene.textures.get('ic_deadly@1x').source[0].width > 0 ? selectTextureAndScale(scene, 'ic_deadly', 16) : {
                        textureKey: 'ic_deadly@1x',
                        scale: 1
                    };
                    deadlyIcon.setTexture(textureKey).setScale(scale).setVisible(true);
                } else {
                    deadlyIcon.setVisible(false);

                    damageText.setText(damageValue);
                    const {
                        textureKey,
                        scale
                    } = scene.textures.get('ic_enemy_collision').source[0].width > 0 ? selectTextureAndScale(scene, 'ic_enemy_collision', 14) : {
                        textureKey: 'ic_enemy_collision',
                        scale: 1
                    };
                    normalIcon.setTexture(textureKey).setScale(scale).setVisible(true);
                    damageText.setVisible(true);

                    const padding = 4;
                    const totalWidth = normalIcon.displayWidth + padding + damageText.width;
                    normalIcon.x = -totalWidth / 2 + normalIcon.displayWidth / 2;
                    damageText.x = normalIcon.x + normalIcon.displayWidth / 2 + padding;
                }
            };

            return {container, setState};
        }
    });
    scene.poolManager.createPool('floatingTexts', {
        classType: Phaser.GameObjects.Text,
        maxSize: 100,
        createCallback: (text) => {

            text.setOrigin(0.5).setDepth(100);
        }
    });
    scene.poolManager.createPool('spawnEffects', {
        classType: Phaser.GameObjects.Sprite,
        maxSize: 200
    });

    scene.poolManager.createPool('playerActions', {
        type: 'data',
        maxSize: 150,
        createCallback: () => []
    });

    const powerupPoolKey = 'powerups';
    scene.poolManager.createPool(powerupPoolKey, {
        classType: PowerUp,
        isPhysicsGroup: true,
        maxSize: 20,
        createCallback: (powerup) => {

            powerup.init(powerupPoolKey);
        }
    });

    console.log('All game object pools initialized.');
}
