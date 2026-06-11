export function initAnimations(scene) {

    const explosionVariants = [
        {suffix: '1x', key: 'boom_ss1@1x', type: 'boom_ss1'},
        {suffix: '0.75x', key: 'boom_ss1@0.75x', type: 'boom_ss1'},
        {suffix: '0.5x', key: 'boom_ss1@0.5x', type: 'boom_ss1'},
        {suffix: '0.25x', key: 'boom_ss1@0.25x', type: 'boom_ss1'},
        {suffix: '1x', key: 'boom_ss2@1x', type: 'boom_ss2'},
        {suffix: '0.75x', key: 'boom_ss2@0.75x', type: 'boom_ss2'},
        {suffix: '0.5x', key: 'boom_ss2@0.5x', type: 'boom_ss2'},
        {suffix: '0.25x', key: 'boom_ss2@0.25x', type: 'boom_ss2'}
    ];

    explosionVariants.forEach(variant => {
        const animKey = `explosion_anim_${variant.type}_${variant.suffix}`;
        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(variant.key, {start: 0, end: 15}),
                frameRate: 16,
                repeat: 0
            });
            console.log(`Explosion animation created: ${animKey}`);
        }
    });

    const spawnVariants = [
        {suffix: '1x', key: 'black_hole_ss@1x'},
        {suffix: '0.75x', key: 'black_hole_ss@0.75x'},
        {suffix: '0.5x', key: 'black_hole_ss@0.5x'},
        {suffix: '0.25x', key: 'black_hole_ss@0.25x'}
    ];

    spawnVariants.forEach(variant => {
        const animKey = `spawn_anim_black_hole_${variant.suffix}`;

        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(variant.key, {start: 0, end: 15}),
                frameRate: 16,
                repeat: 0
            });
            console.log(`Spawn animation created: ${animKey}`);
        }
    });

    const hitAnimKey = 'hit1_anim';
    if (!scene.anims.exists(hitAnimKey)) {
        scene.anims.create({
            key: hitAnimKey,
            frames: scene.anims.generateFrameNumbers('hit1', {start: 0, end: 3}),
            frameRate: 16,
            repeat: 0
        });
        console.log(`Hit animation created: ${hitAnimKey}`);
    }
}