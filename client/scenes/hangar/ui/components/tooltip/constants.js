import {RARITY_COLORS} from '../../../constants.js';

export const BASE_WIDTH = 1920;

export const CONFIG = {
    OFFSET_X: 5,
    OFFSET_Y: 5,
    BASE_PADDING_X: 16,
    BASE_PADDING_Y: 10,
    BASE_LINE_SPACING: 8,
    MAX_TEXT_WIDTH: 300,
    CORNER_RADIUS: {tl: 5, tr: 5, bl: 5, br: 5},
    BG_COLOR: 0x2c2f38,
    BG_ALPHA: 0.95,
};

export const BASE_STYLES = {
    name: {fontFamily: 'Tektur', fontSize: 16, fontStyle: 'bold', color: '#e0e0e0'},
    description: {fontFamily: 'Tektur', fontSize: 14, color: '#C5C5C5'},
    address: {fontFamily: 'Tektur', fontSize: 16, color: '#e0e0e0'},
    countdown: {fontFamily: 'Tektur', fontSize: 14, color: '#C5C5C5'},
    rarity: (rarity) => {
        const rKey = rarity.toString().toLowerCase();
        const color = `#${(RARITY_COLORS[rKey] || RARITY_COLORS.default).toString(16).padStart(6, '0')}`;
        return {...BASE_STYLES.description, color};
    }
};