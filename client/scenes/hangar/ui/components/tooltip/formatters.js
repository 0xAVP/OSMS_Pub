import {BASE_STYLES} from './constants.js';

/**
 * Форматирует оставшееся время в строку "ДД:ЧЧ:ММ:СС".
 */
export function formatCountdown(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')}`;
}

/**
 * Преобразует объект с данными в массив строк для отрисовки.
 */
export function formatData(data, currentStyles) {
    if (typeof data === 'string') return [{key: 'name', text: data, style: currentStyles.name}];
    if (typeof data !== 'object' || data === null) return [];

    const lines = [];
    const fieldOrder = ['name', 'rarity', 'description', 'quantity', 'address', 'countdown'];

    fieldOrder.forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null && value !== '') {
            switch (key) {
                case 'name':
                    lines.push({key: 'name', text: value, style: currentStyles.name});
                    break;
                case 'description':
                    lines.push({key: 'description', text: value, style: currentStyles.description});
                    break;
                case 'address':
                    lines.push({key: 'address', text: value, style: currentStyles.address});
                    break;
                case 'quantity':
                    lines.push({key: 'quantity', text: `Quantity: ${value}`, style: currentStyles.description});
                    break;
                case 'rarity':
                    lines.push({key: 'rarity', text: `Rarity: ${value}`, style: BASE_STYLES.rarity(value)});
                    break;
                case 'countdown':
                    lines.push({key: 'countdown', text: `Time left: ...`, style: currentStyles.countdown});
                    break;
            }
        }
    });
    return lines;
}