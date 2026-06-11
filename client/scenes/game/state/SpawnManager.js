/**
 * Обрабатывает отложенный спавн сетевых объектов.
 * Эта функция выполняется каждый кадр и проверяет, готовы ли ожидающие объекты к визуальному появлению.
 * "Готовность" наступает, когда в буфере объекта есть достаточно старые данные для корректной интерполяции.
 *
 * @param {Phaser.Scene} scene - Текущая игровая сцена.
 * @param {Map<number, object>} unspawnedMap - Карта с данными объектов, ожидающих спавна.
 * @param {Map<number, object[]>} buffersMap - Карта с буферами состояний для этих объектов.
 * @param {object} config - Конфигурация интерполяции (нужна для RENDER_DELAY_MS).
 * @param {function} spawnCallback - Функция, которая будет вызвана для фактического создания спрайта.
 */
export function processUnspawnedObjects(scene, unspawnedMap, buffersMap, config, spawnCallback) {
    if (unspawnedMap.size === 0) {
        return;
    }

    const serverTimeNow = Date.now() - (scene.timeOffset || 0);
    const renderTimestamp = serverTimeNow - config.RENDER_DELAY_MS;

    const unspawnedIds = Array.from(unspawnedMap.keys());

    for (const id of unspawnedIds) {
        const buffer = buffersMap.get(id);

        if (!buffer || buffer.length < 2) {
            continue;
        }

        let fromIndex = -1;
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i].timestamp <= renderTimestamp) {
                fromIndex = i;

            } else {

                break;
            }
        }

        if (fromIndex > -1 && fromIndex < buffer.length - 1) {
            const spawnData = unspawnedMap.get(id);
            if (spawnData) {

                spawnCallback(scene, spawnData, buffer[0]);

                unspawnedMap.delete(id);
            }
        }
    }
}