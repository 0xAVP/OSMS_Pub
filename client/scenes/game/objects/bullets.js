import {DEPTHS} from "../ui/depths";

export const BULLETS = {
    player: {
        bullet1: {
            key: 'bullet1',
            type: 'animation',
            texture: 'bullet1',
            animKey: 'bullet1_anim',
            frameRate: 16,
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.PLAYER_BULLET,
            frameCount: 16,
            sound: null
        },
        bullet2: {
            key: 'bullet2',
            type: 'animation',
            texture: 'bullet2',
            animKey: 'bullet2_anim',
            frameRate: 16,
            frameWidth: 120,
            frameHeight: 40,
            scale: 0.5,
            depth: DEPTHS.PLAYER_BULLET,
            frameCount: 4,
            sound: null
        },
        bullet3: {
            key: 'fire_orange',
            type: 'image',
            texture: 'fire_orange',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.PLAYER_BULLET,
            angularSpeed: 720,
            sound: {
                key: 'shoot_sound1',
                volume: 0.2
            }
        },
        bullet4: {
            key: 'fire_blue',
            type: 'image',
            texture: 'fire_blue',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.PLAYER_BULLET,
            angularSpeed: 720,
            sound: {
                key: 'shoot_sound1',
                volume: 0.2
            }
        },
        bullet5: {
            key: 'fire_green',
            type: 'image',
            texture: 'fire_green',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.PLAYER_BULLET,
            angularSpeed: 720,
            sound: {
                key: 'shoot_sound1',
                volume: 0.2
            }
        },
        bullet6: {
            key: 'fire_pink',
            type: 'image',
            texture: 'fire_pink',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.PLAYER_BULLET,
            angularSpeed: 720,
            sound: {
                key: 'shoot_sound1',
                volume: 0.2
            }
        }
    },
    enemy: {
        1: {
            key: 'bullet1',
            type: 'animation',
            texture: 'bullet1',
            animKey: 'bullet1_anim',
            frameRate: 16,
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.ENEMY_BULLET,
            frameCount: 16
        },
        2: {
            key: 'bullet2',
            type: 'animation',
            texture: 'bullet2',
            animKey: 'bullet2_anim',
            frameRate: 16,
            frameWidth: 120,
            frameHeight: 40,
            scale: 0.5,
            depth: DEPTHS.ENEMY_BULLET,
            frameCount: 4
        },
        3: {
            key: 'fire_orange',
            type: 'image',
            texture: 'fire_orange',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.ENEMY_BULLET,
            angularSpeed: 360
        },
        4: {
            key: 'fire_blue',
            type: 'image',
            texture: 'fire_blue',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.ENEMY_BULLET,
            angularSpeed: 360
        },
        5: {
            key: 'fire_green',
            type: 'image',
            texture: 'fire_green',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.ENEMY_BULLET,
            angularSpeed: 360
        },
        6: {
            key: 'fire_pink',
            type: 'image',
            texture: 'fire_pink',
            frameWidth: 32,
            frameHeight: 32,
            scale: 1,
            depth: DEPTHS.ENEMY_BULLET,
            angularSpeed: 360
        }
    }

};

export function initBulletAnimations(scene) {

    const allBullets = [
        ...Object.values(BULLETS.player),
        ...Object.values(BULLETS.enemy)
    ];

    allBullets.forEach(bullet => {

        if (bullet.type === 'animation') {

            if (!scene.textures.exists(bullet.texture)) {
                console.error(`Texture ${bullet.texture} not found for animation ${bullet.animKey}`);
                return;
            }

            if (!scene.anims.exists(bullet.animKey)) {
                scene.anims.create({
                    key: bullet.animKey,
                    frames: scene.anims.generateFrameNumbers(bullet.texture, {
                        start: 0,
                        end: bullet.frameCount - 1
                    }),
                    frameRate: bullet.frameRate,
                    repeat: -1
                });

                console.log(`Animation ${bullet.animKey} created for ${bullet.key} with ${bullet.frameCount} frames`);
            }
        }

    });
}