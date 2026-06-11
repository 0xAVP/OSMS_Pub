export const Utils = {

    formatDate(isoString) {
        if (!isoString) return '...';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '...';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}.${month}.${year}`;
    },

    /**
     * Рассчитывает и форматирует оставшееся время до истечения срока.
     * @param {string | Date} isoString - Дата истечения.
     * @returns {string}
     */
    formatTimeToExpire(isoString) {
        if (!isoString) return '';
        const now = new Date();
        const expiry = new Date(isoString);
        if (isNaN(expiry.getTime())) return '';

        const diffMs = expiry.getTime() - now.getTime();

        if (diffMs <= 0) return 'Expired';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return `${diffDays}d left`;

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours > 0) return `${diffHours}h left`;

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes > 0 ? `${diffMinutes}m left` : '<1m left';
    },

    formatCountdown(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const d = Math.floor(totalSeconds / 86400);
        const h = Math.floor((totalSeconds % 86400) / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);

        return `${String(d).padStart(2, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    getCurrentServerTime(scene) {
        const delta = scene.registry.get('time_delta') || 0;
        return Date.now() + delta;
    },

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    isOutOfBounds(sprite, bounds) {
        if (!sprite) {

            return false;
        }
        const spriteWidth = sprite.displayWidth || sprite.width || 0;
        const spriteHeight = sprite.displayHeight || sprite.height || 0;
        const left = sprite.x - spriteWidth / 2;
        const right = sprite.x + spriteWidth / 2;
        const top = sprite.y - spriteHeight / 2;
        const bottom = sprite.y + spriteHeight / 2;

        return (
            right < 0 ||
            left > bounds.width ||
            bottom < 0 ||
            top > bounds.height
        );
    },

    removeIfOutOfBounds(sprite, bounds, buffer, id) {
        if (this.isOutOfBounds(sprite, bounds)) {

            sprite.setActive(false).setVisible(false);
            if (buffer && id) {
                buffer.delete(id);
            }
            return true;
        }

        return false;
    },

    updateText(textObject, label, value, isInteger = true) {
        const formattedValue = isInteger ? Math.floor(value) : value.toFixed(2);
        textObject.setText(`${label}: ${formattedValue}`);
    },

    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

};

export function selectSpritesheetTextureAndScale(scene, baseTextureKey, targetSize, useHeight = false) {

    const defaultResult = {
        textureKey: `${baseTextureKey}@1x`,
        scale: targetSize / 512
    };

    const baseTexture = `${baseTextureKey}@1x`;
    if (!scene.textures.exists(baseTexture)) {
        console.warn(`Spritesheet texture ${baseTexture} not found, returning default`);
        return defaultResult;
    }

    const baseTextureData = scene.textures.get(baseTexture);
    const baseFrameSize = useHeight ? (baseTextureData.frames[0]?.height || 512) : (baseTextureData.frames[0]?.width || 512);

    const desiredScale = targetSize / baseFrameSize;

    const scales = [
        {suffix: '@1x', frameSize: 512},
        {suffix: '@0.75x', frameSize: 384},
        {suffix: '@0.5x', frameSize: 256},
        {suffix: '@0.25x', frameSize: 128}
    ];
    const availableTextures = [];

    scales.forEach(scale => {
        const textureKey = `${baseTextureKey}${scale.suffix}`;
        if (scene.textures.exists(textureKey)) {
            const finalScale = desiredScale * (baseFrameSize / scale.frameSize);
            availableTextures.push({textureKey, textureScale: scale.frameSize / baseFrameSize, finalScale});
        }
    });

    if (availableTextures.length === 0) {
        console.warn(`No spritesheet variants found for ${baseTextureKey}, using @1x`);
        return {textureKey: baseTexture, scale: desiredScale};
    }

    let selectedTexture = availableTextures.reduce((best, current) => {
        const currentDiff = Math.abs(current.finalScale - 1);
        const bestDiff = Math.abs(best.finalScale - 1);

        if (currentDiff < bestDiff || (current.finalScale <= 1 && best.finalScale > 1)) {
            return current;
        }
        return best;
    }, availableTextures[0]);

    return {
        textureKey: selectedTexture.textureKey,
        scale: selectedTexture.finalScale
    };
}

export function selectTextureAndScale(scene, baseTextureKey, targetSize, useHeight = false) {

    if (!baseTextureKey) {
        return {textureKey: '__MISSING', scale: 1};
    }

    const textureBaseKey = baseTextureKey.replace(/_mk\d+$/, '');

    const defaultResult = {
        textureKey: textureBaseKey,
        scale: useHeight ? 0.6 * (scene.scale.height / 600) : 0.6 * (scene.scale.width / 800)
    };

    const baseTexture = `${textureBaseKey}@1x`;
    if (!scene.textures.exists(baseTexture)) {
        console.warn(`Texture ${baseTexture} not found, returning default`);
        return defaultResult;
    }

    const baseTextureData = scene.textures.get(baseTexture).source[0];
    const baseTextureSize = useHeight ? baseTextureData.height : baseTextureData.width;

    const desiredScale = useHeight ? (targetSize / baseTextureSize) * (scene.scale.height / 600) : targetSize / baseTextureSize;

    const scales = [1, 0.75, 0.5, 0.25];
    const availableTextures = [];

    scales.forEach(scale => {
        const textureKey = `${textureBaseKey}@${scale}x`;
        if (scene.textures.exists(textureKey)) {
            const finalScale = desiredScale / scale;
            availableTextures.push({textureKey, textureScale: scale, finalScale});
        }
    });

    if (availableTextures.length === 0) {
        console.warn(`No texture variants found for ${textureBaseKey}, using @1x`);
        return {textureKey: baseTexture, scale: desiredScale};
    }

    let selectedTexture = availableTextures.reduce((best, current) => {
        const currentDiff = Math.abs(current.finalScale - 1);
        const bestDiff = Math.abs(best.finalScale - 1);
        if (currentDiff < bestDiff || (current.finalScale <= 1 && best.finalScale > 1)) {
            return current;
        }
        return best;
    }, availableTextures[0]);

    return {
        textureKey: selectedTexture.textureKey,
        scale: selectedTexture.finalScale
    };
}

export function createAdaptiveText(scene, x, y, text, parentContainer, options = {}) {

    const {
        baseFontSize = 12,
        minFontSize = 10,
        maxFontSize = 16,
        style = {}
    } = options;

    const parentScale = parentContainer ? parentContainer.scaleX : 1;

    const scaleMultiplier = scene.adjustedWidth / 1920;
    const calculatedFontSize = Math.round(baseFontSize * scaleMultiplier);
    const finalFontSize = Phaser.Math.Clamp(calculatedFontSize, minFontSize, maxFontSize);

    const textWrapper = scene.add.container(Math.round(x), Math.round(y));

    if (parentScale > 0) {
        textWrapper.setScale(1 / parentScale);
    }

    const finalStyle = {
        fontFamily: 'Tektur',
        color: '#000000',
        ...style,
        fontSize: `${finalFontSize}px`,
    };

    const textObject = scene.add.text(0, 0, text, finalStyle).setOrigin(0.5);
    textWrapper.add(textObject);
    textWrapper.setDepth(506);

    return textWrapper;
}