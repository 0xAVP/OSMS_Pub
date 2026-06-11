const fs = require('fs');
const path = require('path');

let validResourceKeys = new Set();
let validBlueprintKeys = new Set();
let validModuleKeys = new Set();
let validHullKeys = new Set();
let validOtherKeys = new Set();
const stagestoneRegex = /^stagestone_tier_(\d+)$/;
let isLoaded = false;

/**
 * Внутренняя функция для однократной загрузки ключей из файлов.
 * Она читает JSON-файлы, но берет из них только массивы ключей,
 * что очень быстро и не требует много памяти.
 */
function loadItemKeys() {
    if (isLoaded) return;
    try {
        const resourcesPath = path.join(__dirname, 'resources.json');
        const blueprintsPath = path.join(__dirname, 'blueprints.json');
        const modulesPath = path.join(__dirname, 'modules.json');
        const hullsPath = path.join(__dirname, 'hulls.json');
        const otherPath = path.join(__dirname, 'other.json');

        const resourcesCatalog = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
        const blueprintsCatalog = JSON.parse(fs.readFileSync(blueprintsPath, 'utf8'));
        const modulesCatalog = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
        const hullsCatalog = JSON.parse(fs.readFileSync(hullsPath, 'utf8'));
        const otherCatalog = JSON.parse(fs.readFileSync(otherPath, 'utf8'));

        validResourceKeys = new Set(Object.keys(resourcesCatalog));
        validModuleKeys = new Set(Object.keys(modulesCatalog));
        validHullKeys = new Set(Object.keys(hullsCatalog));
        validOtherKeys = new Set(Object.keys(otherCatalog));

        const blueprintKeys = [
            ...(blueprintsCatalog.components || []),
            ...(blueprintsCatalog.modules || []),
            ...(blueprintsCatalog.hulls || []),
            ...(blueprintsCatalog.other || [])
        ].map(bp => bp.key);
        validBlueprintKeys = new Set(blueprintKeys);

        isLoaded = true;
        console.log(`[ItemValidator] Инициализирован: ${validResourceKeys.size} ресурсов, ${validBlueprintKeys.size} чертежей, ${validModuleKeys.size} модулей, ${validOtherKeys.size} прочих.`);

    } catch (error) {
        console.error(`[ItemValidator] КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить ключи предметов: ${error.message}`);

    }
}

function isValidResource(key) {
    return validResourceKeys.has(key);
}

function isValidOther(key) {
    return validOtherKeys.has(key);
}

function isValidBlueprint(key) {
    return validBlueprintKeys.has(key);
}

function isValidModule(key) {
    return validModuleKeys.has(key);
}

function isValidHull(key) {
    return validHullKeys.has(key);
}

function isValidStagestone(key) {
    if (typeof key !== 'string') return false;
    return stagestoneRegex.test(key);
}

loadItemKeys();

module.exports = {
    isValidResource,
    isValidBlueprint,
    isValidModule,
    isValidHull,
    isValidOther,
    isValidStagestone,
};