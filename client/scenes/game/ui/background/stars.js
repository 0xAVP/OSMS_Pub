import {DEPTHS} from "../depths";

export function createStarsBackground(scene) {

    if (!scene.textures.exists('smallStarParticle')) {
        const smallStarGraphics = scene.make.graphics({x: 0, y: 0});
        smallStarGraphics.fillStyle(0xffffff);
        smallStarGraphics.fillCircle(2, 2, 2);
        const smallStarTexture = smallStarGraphics.generateTexture('smallStarParticle', 4, 4);
        smallStarGraphics.destroy();
    }

    if (!scene.textures.exists('glowStarParticle')) {
        const glowStarGraphics = scene.make.graphics({x: 0, y: 0});
        glowStarGraphics.fillStyle(0xffffff, 1.0);
        glowStarGraphics.fillCircle(8, 8, 4);
        glowStarGraphics.fillStyle(0xffffff, 0.3);
        glowStarGraphics.fillCircle(8, 8, 8);
        const glowStarTexture = glowStarGraphics.generateTexture('glowStarParticle', 16, 16);
        glowStarGraphics.destroy();
    }

    const totalParticles = Math.floor((scene.startWidth + scene.startHeight) / 15);
    const dustParticles = Math.floor(totalParticles * 0.7);
    const brightParticles = Math.floor(totalParticles * 0.2);
    const pulsarParticles = Math.floor(totalParticles * 0.1);

    const dustEmitter = scene.add.particles(0, 0, 'smallStarParticle', {
        emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(0, 0, scene.startWidth, scene.startHeight),
            quantity: dustParticles
        },
        scale: {start: 0.2, end: 0.4, random: true},
        alpha: {start: 0.3, end: 0.7, random: true},
        tint: {start: 0xffffff, end: 0xffffff, random: true},
        lifespan: {min: 10000, max: 20000},
        speed: {min: 3, max: 4},
        angle: {min: 170, max: 190},
        frequency: 50,
        blendMode: 'ADD',
        depth: DEPTHS.BACKGROUND_STARS
    });

    const brightEmitter = scene.add.particles(0, 0, 'glowStarParticle', {
        emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(0, 0, scene.startWidth, scene.startHeight),
            quantity: brightParticles
        },
        scale: {start: 0.2, end: 0.3, random: true},
        alpha: {start: 0.5, end: 0.8, random: true},
        tint: {start: 0xffffff, end: 0xffffff, random: true},
        lifespan: {min: 5000, max: 10000},
        speed: {min: 1, max: 2},
        angle: {min: 170, max: 190},
        frequency: 150,
        blendMode: 'ADD',
        depth: DEPTHS.BACKGROUND_STARS + 0.1
    });

    const pulsarEmitter = scene.add.particles(0, 0, 'glowStarParticle', {
        emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(0, 0, scene.startWidth, scene.startHeight),
            quantity: pulsarParticles
        },
        scale: {start: 0.2, end: 0.3, ease: 'Sine.easeInOut'},
        alpha: {start: 0.6, end: 0.8, ease: 'Sine.easeInOut'},
        tint: {start: 0xffffff, end: 0xffffff, random: true},
        lifespan: {min: 10000, max: 50000},
        speed: 0,
        frequency: 800,
        blendMode: 'ADD',
        depth: DEPTHS.BACKGROUND_STARS + 0.2
    });

    const starsBackground = {
        dustEmitter,
        brightEmitter,
        pulsarEmitter
    };

    return starsBackground;
}

export function updateStarsBackground(scene, delta) {

}