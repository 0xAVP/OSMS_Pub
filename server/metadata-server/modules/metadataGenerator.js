const mongoose = require('mongoose');
const shipSchema = require('./shipSchema');
const logger = require('../core/logger');
const crypto = require('crypto');

const Ship = mongoose.model('Ship', shipSchema, 'ships');

const SHIP_TYPE_METADATA = {
    'Nebular': {
        description: 'A reliable workhorse of any fleet. The Nebular boasts balanced defensive systems and a robust power core, making it a versatile ship for pilots just beginning their journey in space.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Nebular.jpg',
    },
    'Horizon': {
        description: 'Engineered for aggressive "hit-and-run" tactics, the Horizon specializes in dealing colossal damage. Its bonuses are focused on enhancing critical strikes, allowing it to neutralize targets with a single, precise volley.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Horizon.jpg',
    },
    'Guardian': {
        description: 'A true bastion of the fleet. The Guardian is a mobile fortress, capable of withstanding heavy fire thanks to its reinforced armor and a unique ability to absorb a significant portion of incoming damage.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Guardian.jpg',
    },
    'Hypercon': {
        description: 'Incredibly agile and elusive, the Hypercon is a master of maneuver warfare. Its systems are tuned for evading attacks and maintaining a high rate of fire through rapid energy regeneration.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Hypercon.jpg',
    },
    'Cerberus': {
        description: 'A powerful and resilient battlecruiser, the Cerberus is built for prolonged engagements. Its enhanced shields, armor, and improved energy regeneration allow it to outlast any opponent on the battlefield.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Cerberus.jpg',
    },
    'Scopus': {
        description: 'A specialized vessel for tactical superiority. The Scopus combines increased firepower with unique shield modifications that allow it to recover more quickly after taking damage.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Scopus.jpg',
    },
    'Leviathan': {
        description: 'An awe-inspiring flagship. The Leviathan is an impenetrable colossus whose systems are focused on survivability. Its reinforced hull and advanced shield regeneration technologies make it nearly indestructible.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Leviathan.jpg',
    },
    'Celestial': {
        description: 'An engineering masterpiece built from blueprints. Each Celestial vessel is unique, thanks to an experimental bonus matrix that generates random enhancements upon construction.',
        edition: 's0',
        image: 'https://onesoulmanyships.xyz/assets/nfts/ships/Leviathan.jpg',
    }
};

function formatMarketplaceMetadata(shipData, modulesCatalog, bonusNameMap) {
    const typeMetadata = SHIP_TYPE_METADATA[shipData.type]

    const findModuleByKey = (key) => modulesCatalog[key];

    ['weapons.weapon1', 'weapons.weapon2', 'shield', 'armor', 'engine', 'extra.extra1', 'extra.extra2'].forEach(path => {
        const parts = path.split('.');
        let current = shipData.modules;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current?.[parts[i]];
            if (!current) return;
        }
        const moduleKey = parts[parts.length - 1];
        if (current?.[moduleKey]?.module?.key) {
            const catalogModule = findModuleByKey(current[moduleKey].module.key);
            if (catalogModule) {

                current[moduleKey].module = {
                    ...catalogModule,
                    ...current[moduleKey].module
                };
            } else {
                console.warn(`Web3Server: Module not found in catalog for key: ${current[moduleKey].module.key}`);
            }
        }
    });

    const attributes = [
        {trait_type: "Type", value: shipData.type},
        {trait_type: "Level", value: shipData.level, display_type: "number"},
        {trait_type: "Hull Strength", value: shipData.hull, display_type: "number"},
        {trait_type: "Edition", value: typeMetadata.edition}
    ];

    if (shipData.bonuses && typeof shipData.bonuses === 'object') {
        for (const [key, value] of Object.entries(shipData.bonuses)) {
            attributes.push({

                trait_type: bonusNameMap[key] || key,
                value: `${value}%`
            });
        }
    }

    if (shipData.modules.weapons.weapon1?.module?.key) {

        attributes.push(
            {
                trait_type: "Weapon 1",
                value: `${shipData.modules.weapons.weapon1.module.name} (Level ${shipData.modules.weapons.weapon1.module.level}, ${shipData.modules.weapons.weapon1.module.rarity})`
            },
            {
                trait_type: "Weapon 1 Damage",
                value: `${shipData.modules.weapons.weapon1.module.params.damage.min}-${shipData.modules.weapons.weapon1.module.params.damage.max}`
            },
            {
                trait_type: "Weapon 1 Fire Rate",
                value: shipData.modules.weapons.weapon1.module.params.fireRate,
                display_type: "number"
            },
            {
                trait_type: "Weapon 1 Critical",
                value: `Chance: ${shipData.modules.weapons.weapon1.module.params?.critical?.chance ?? 0}, Modifier: ${shipData.modules.weapons.weapon1.module.params?.critical?.modifier ?? 0}`,
                display_type: "number"
            }
        );
    }

    if (shipData.modules.weapons.weapon2.module?.name) {
        attributes.push(
            {
                trait_type: "Weapon 2",
                value: `${shipData.modules.weapons.weapon2.module.name} (Level ${shipData.modules.weapons.weapon2.module.level}, ${shipData.modules.weapons.weapon2.module.rarity})`
            },
            {
                trait_type: "Weapon 2 Damage",
                value: `${shipData.modules.weapons.weapon2.module.params.damage.min}-${shipData.modules.weapons.weapon2.module.params.damage.max}`
            },
            {
                trait_type: "Weapon 2 Fire Rate",
                value: shipData.modules.weapons.weapon2.module.params.fireRate,
                display_type: "number"
            },
            {
                trait_type: "Weapon 2 Critical",
                value: `Chance: ${shipData.modules.weapons.weapon2.module.params?.critical?.chance ?? 0}, Modifier: ${shipData.modules.weapons.weapon2.module.params?.critical?.modifier ?? 0}`,
                display_type: "number"
            }
        );
    } else {
        attributes.push(
            {
                trait_type: "Weapon 2",
                value: "Empty Slot"
            }
        );
    }

    if (shipData.modules.shield?.module?.name) {
        attributes.push(
            {
                trait_type: "Shield",
                value: `${shipData.modules.shield.module.name} (Level ${shipData.modules.shield.module.level}, ${shipData.modules.shield.module.rarity})`
            },
            {
                trait_type: "Shield Capacity",
                value: shipData.modules.shield.module.params.shield.capacity,
                display_type: "number"
            },
            {
                trait_type: "Shield Regen",
                value: shipData.modules.shield.module.params.shield.regen,
                display_type: "number"
            }
        );
    }

    if (shipData.modules.armor?.module?.name) {
        attributes.push(
            {
                trait_type: "Armor",
                value: `${shipData.modules.armor.module.name} (Level ${shipData.modules.armor.module.level}, ${shipData.modules.armor.module.rarity})`
            },
            {
                trait_type: "Armor Capacity",
                value: shipData.modules.armor.module.params.armor.capacity,
                display_type: "number"
            },
            {
                trait_type: "Armor Absorption",
                value: `Chance: ${shipData.modules.armor.module.params?.absorption?.chance ?? 0}, Absorb: ${shipData.modules.armor.module.params?.absorption?.absorb ?? 0}`,
                display_type: "number"
            }
        );
    }

    if (shipData.modules.engine?.module?.name) {
        attributes.push(
            {
                trait_type: "Engine",
                value: `${shipData.modules.engine.module.name} (Level ${shipData.modules.engine.module.level}, ${shipData.modules.engine.module.rarity})`
            },
            {
                trait_type: "Engine Speed",
                value: shipData.modules.engine.module.params.speed,
                display_type: "number"
            },
            {
                trait_type: "Engine Energy",
                value: `Capacity: ${shipData.modules.engine.module.params.energy.capacity}, Regen: ${shipData.modules.engine.module.params.energy.regen}`,
                display_type: "number"
            },
            {
                trait_type: "Evasion Chance",
                value: shipData.modules.engine.module.params?.evasion ?? 0,
                display_type: "number"
            }
        );
    }

    if (shipData.modules.extra?.extra1?.slotUid) {

    } else {
        attributes.push(
            {
                trait_type: "Extra 1",
                value: "Empty Slot"
            }
        );
    }

    if (shipData.modules.extra.extra2.module?.name) {

    } else {
        attributes.push(
            {
                trait_type: "Extra 2",
                value: "Empty Slot"
            }
        );
    }

    return {
        name: shipData.type,
        description: typeMetadata.description,
        image: typeMetadata.image,
        attributes
    };
}

function createMetadataGenerator(catalogs) {

    const {modules, bonuses: bonusNameMap} = catalogs;

    if (!modules || !bonusNameMap) {
        logger.error("[MetadataGenerator] FATAL: Не удалось получить все необходимые каталоги (modules, bonuses). Генератор не будет работать.");

        return () => Promise.resolve({metadata: null, etag: null});
    }

    return async function generateMetadataFor(tokenId) {
        const shipId = parseInt(tokenId, 10);
        if (isNaN(shipId)) {
            logger.warn(`[MetadataGenerator] Получен невалидный tokenId: ${tokenId}`);
            return null;
        }

        logger.debug(`[MetadataGenerator] Начало генерации для корабля #${shipId}`);

        const shipData = await Ship.findOne({shipId}).lean();

        if (!shipData) {
            logger.warn(`[MetadataGenerator] Корабль #${shipId} не найден в MongoDB.`);
            return {metadata: null, etag: null};
        }

        const finalMetadata = formatMarketplaceMetadata(shipData, modules, bonusNameMap);

        const metadataString = JSON.stringify(finalMetadata);
        const etag = crypto.createHash('md5').update(metadataString).digest('hex');

        logger.info(`[MetadataGenerator] Генерация для #${shipId} завершена. ETag: ${etag}`);

        return {metadata: finalMetadata, etag: etag};
    };
}

module.exports = {createMetadataGenerator};