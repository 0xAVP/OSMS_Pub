import {webSocketManager} from '../WebSocketManager.js';

/**
 * Запрашивает и обновляет каталог в реестре.
 * 'this' - это контекст сцены.
 */

export async function refreshCatalog() {

    if (this.registry.get('catalogs_loaded') === true) {
        console.log('Catalogs found in Registry. Using cached data.');
        this.catalog = this.registry.get('catalog_data');
        return this.catalog;
    }

    try {
        const data = await webSocketManager.sendMessage('get-catalog');

        if (!data) {
            console.error('Failed to load catalog: No data received.');
            this.catalog = {};
            return null;
        }

        const fullCatalog = {
            blueprints: data.blueprints,
            resources: data.resources,
            components: data.components,
            modules: data.modules,
            hulls: data.hulls,
            other: data.other,
            stagestone_template: data.stagestone_template,
            buffs: data.buffs
        };

        this.registry.set('catalog_data', fullCatalog);
        this.registry.set('catalogs_loaded', true);
        console.log('Catalogs received from server and saved to Registry.');

        this.catalog = fullCatalog;
        return this.catalog;

    } catch (error) {
        console.error('Error fetching catalog:', error.message);
        return null;
    }
}

export function getCatalogData(scene, key, category) {
    let catalogData = {};
    if (!key || !category || !scene.catalog) {
        return {name: key || 'Unknown', description: 'No description'};
    }

    const template = scene.catalog.stagestone_template;
    if (category === 'stagestones' && template && key.startsWith(template.key_prefix)) {

        const tierString = key.replace(template.key_prefix, '');
        const tier = parseInt(tierString, 10);

        if (!isNaN(tier) && tier > 0) {

            const unlockedStage = (tier - 1) * 5 + 5;

            return {
                ...template,
                key: key,
                name: template.name_template.replace('{tier}', tier),
                description: template.description_template.replace('{stage}', unlockedStage),
                activatesBuff: template.activatesBuff.replace('{tier}', tier),
                unlocksStage: unlockedStage
            };
        }
    }
    try {
        if (category === 'components') {
            catalogData = scene.catalog.components?.[key] || {};
        } else if (category === 'resources') {
            catalogData = scene.catalog.resources?.[key] || {};
        } else if (category === 'modules') {
            catalogData = scene.catalog.modules?.[key] || {};
        } else if (category === 'other') {
            catalogData = scene.catalog.other?.[key] || {};
        } else if (category === 'hulls') {
            catalogData = scene.catalog.hulls?.[key] || {};
        } else if (category === 'blueprints') {
            catalogData = scene.catalog.blueprints?.modules?.find(item => item.key === key) ||
                scene.catalog.blueprints?.components?.find(item => item.key === key) ||
                scene.catalog.blueprints?.hulls?.find(item => item.key === key) ||
                scene.catalog.blueprints?.other?.find(item => item.key === key) ||
                {};
        }
        return {
            name: catalogData.name || key,
            description: catalogData.description || 'No description',
            ...catalogData
        };
    } catch (error) {
        console.warn(`Error fetching catalog data for key=${key}, category=${category}: ${error.message}`);
        return {name: key || 'Unknown', description: 'No description'};
    }
}

export function getModuleTypeCategoryFromCatalog(scene, item) {
    const itemCategory = item.category;
    const itemKey = item.key;
    const itemType = getCatalogData(scene, itemKey, itemCategory).type;
    return {category: itemCategory, type: itemType};
}