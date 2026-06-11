/**
 * Обрабатывает события нажатия клавиш для компонента QuantityInput.
 * @param {KeyboardEvent} event - Объект события клавиатуры.
 * @param {object} state - Текущее состояние инпута.
 * @param {string} state.inputBuffer - Текущий буфер ввода.
 * @param {number} state.effectiveMax - Максимально допустимое значение.
 * @returns {{buffer: string, action: 'input' | 'confirm' | 'cancel' | 'none'}} - Новый буфер и действие.
 */
export function handleKeyDown(event, state) {
    event.stopPropagation();

    if (event.key === 'Enter') {
        return {buffer: state.inputBuffer, action: 'confirm'};
    }

    if (event.key === 'Escape') {
        return {buffer: state.inputBuffer, action: 'cancel'};
    }

    if (event.key === 'Backspace') {
        const newBuffer = state.inputBuffer.slice(0, -1);
        return {buffer: newBuffer, action: 'input'};
    }

    if (/[0-9]/.test(event.key)) {
        let newBuffer = state.inputBuffer + event.key;

        if (newBuffer.length > 1 && newBuffer.startsWith('0')) {
            newBuffer = newBuffer.substring(1);
        }

        const numValue = parseInt(newBuffer, 10);
        if (numValue > state.effectiveMax) {

            return {buffer: state.effectiveMax.toString(), action: 'input'};
        }

        return {buffer: newBuffer, action: 'input'};
    }

    return {buffer: state.inputBuffer, action: 'none'};
}
