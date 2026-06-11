const fs = require('fs');
const path = require('path');
const {isStagestone, getStagestoneData, getStagestoneItemTemplate} = require('./stagestones.js');

let resourcesCatalog = null;
let blueprintsCatalog = null;
let componentsCatalog = null;
let modulesCatalog = null;
let hullsCatalog = null;
let otherCatalog = null;
let weaponMechanicsCatalog = null;

function loadCatalog() {
    try {
        const resourcesPath = path.join(__dirname, 'resources.json');
        const componentsPath = path.join(__dirname, 'components.json');
        const modulesPath = path.join(__dirname, 'modules.json');
        const blueprintsPath = path.join(__dirname, 'blueprints.json');
        const weaponMechanicsPath = path.join(__dirname, 'weaponMechanics.json');
        const hullsPath = path.join(__dirname, 'hulls.json');
        const otherPath = path.join(__dirname, 'other.json');

        resourcesCatalog = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
        blueprintsCatalog = JSON.parse(fs.readFileSync(blueprintsPath, 'utf8'));
        componentsCatalog = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));
        modulesCatalog = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
        hullsCatalog = JSON.parse(fs.readFileSync(hullsPath, 'utf8'));
        weaponMechanicsCatalog = JSON.parse(fs.readFileSync(weaponMechanicsPath, 'utf8'));
        otherCatalog = JSON.parse(fs.readFileSync(otherPath, 'utf8'));

        console.log('dbServer: All Catalogs loaded successfully');
    } catch (error) {
        console.log(`Failed to load catalogs: ${error.message}`);
        throw error;
    }
}

function getWeaponMechanics() {
    return weaponMechanicsCatalog;
}

function getResource(key) {
    const resource = resourcesCatalog?.[key];
    if (!resource) return null;
    return {
        key,
        ...resource
    };
}

function getModule(key) {
    const module = modulesCatalog?.[key];
    if (!module) return null;
    return {
        key,
        ...module
    };
}

function getComponent(key) {
    const component = componentsCatalog?.[key];
    if (!component) return null;
    return {
        key,
        ...component
    };
}

function getBlueprint(key) {
    const subcategories = [
        {name: 'components', catalog: blueprintsCatalog?.components},
        {name: 'modules', catalog: blueprintsCatalog?.modules},
        {name: 'ships', catalog: blueprintsCatalog?.ships},
        {name: 'hulls', catalog: blueprintsCatalog?.hulls},
        {name: 'other', catalog: blueprintsCatalog?.other}
    ];

    for (const {name, catalog} of subcategories) {
        const blueprint = catalog?.find(r => r.key === key);
        if (blueprint) return {key, subcategory: name, ...blueprint};
    }

    return null;
}

function getAllModules() {
    return modulesCatalog;
}

function getAllBlueprints() {
    return blueprintsCatalog;
}

function getAllResources() {
    return resourcesCatalog;
}

function getAllComponents() {
    return componentsCatalog;
}

function getStagestoneTemplate() {
    return getStagestoneItemTemplate();
}

function getHull(key) {
    const hull = hullsCatalog?.[key];
    if (!hull) return null;
    return {key, ...hull};
}

function getAllHulls() {
    return hullsCatalog;
}

function getAllOther() {
    return otherCatalog;
}

function getItemData(itemKey) {

    if (isStagestone(itemKey)) {
        return getStagestoneData(itemKey);
    }

    if (modulesCatalog && modulesCatalog.hasOwnProperty(itemKey)) {
        return {
            key: itemKey,
            category: 'modules',
            ...modulesCatalog[itemKey]
        };
    }

    if (resourcesCatalog && resourcesCatalog.hasOwnProperty(itemKey)) {
        return {
            key: itemKey,
            category: 'resources',
            ...resourcesCatalog[itemKey]
        };
    }

    if (componentsCatalog && componentsCatalog.hasOwnProperty(itemKey)) {
        return {
            key: itemKey,
            category: 'components',
            ...componentsCatalog[itemKey]
        };
    }

    if (otherCatalog && otherCatalog.hasOwnProperty(itemKey)) {
        return {
            key: itemKey,
            ...otherCatalog[itemKey]
        };
    }

    if (hullsCatalog && hullsCatalog.hasOwnProperty(itemKey)) {
        return {
            key: itemKey,
            ...hullsCatalog[itemKey]
        };
    }

    if (blueprintsCatalog) {
        const blueprintSubCategories = [
            {name: 'components', catalog: blueprintsCatalog.components},
            {name: 'modules', catalog: blueprintsCatalog.modules},
            {name: 'ships', catalog: blueprintsCatalog.ships},
            {name: 'other', catalog: blueprintsCatalog.other}
        ];

        for (const subCat of blueprintSubCategories) {
            if (subCat.catalog) {

                const blueprint = subCat.catalog.find(bp => bp.key === itemKey);
                if (blueprint) {
                    return {
                        ...blueprint,
                        key: itemKey,
                        category: 'blueprints',
                        subcategory: subCat.name
                    };
                }
            }
        }
    }

    return null;
}

module.exports = {
    loadCatalog,
    getStagestoneTemplate,
    getWeaponMechanics,
    getItemData,
    getResource,
    getComponent,
    getModule,
    getBlueprint,
    getAllResources,
    getAllComponents,
    getAllBlueprints,
    getAllModules,
    getHull,
    getAllOther,
    getAllHulls
};