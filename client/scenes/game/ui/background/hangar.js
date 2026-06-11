import {selectTextureAndScale} from '../../../core/utils.js';
import {DEPTHS} from "../depths";

export function createHangar(scene) {
    const hangarTextureBaseKey = 'base';
    const baseTextureKey = `${hangarTextureBaseKey}@1x`;

    if (!scene.textures.exists(baseTextureKey)) {
        console.error(`Texture ${baseTextureKey} not found!`);
        return null;
    }

    const maxScreenHeight = (1.2 / 3) * scene.startHeight;

    const textureData = scene.textures.get(baseTextureKey);
    const baseTextureHeight = textureData.source[0].height;

    let {textureKey: hangarTextureKey, scale: finalScale} = selectTextureAndScale(
        scene,
        hangarTextureBaseKey,
        maxScreenHeight,
        true
    );

    const selectedTextureData = scene.textures.get(hangarTextureKey);
    const selectedTextureHeight = selectedTextureData.source[0].height;
    const calculatedHeight = selectedTextureHeight * finalScale;
    if (calculatedHeight > maxScreenHeight) {
        finalScale = maxScreenHeight / selectedTextureHeight;
        console.warn(`Adjusted scale to ${finalScale.toFixed(4)} to fit maxScreenHeight=${maxScreenHeight}`);
    }

    const x = 0;
    const y = scene.startHeight / 2;

    const hangarLayer = scene.add.image(x, y, hangarTextureKey)
        .setOrigin(0.0, 0.5)
        .setDepth(DEPTHS.BASE)
        .setScale(finalScale)
        .setAlpha(1)
        .setVisible(true);

    return {
        hangarLayer,
        hangarHeight: hangarLayer.displayHeight,
        hangarScale: finalScale,
        hangarX: x,
        hangarY: y
    };
}