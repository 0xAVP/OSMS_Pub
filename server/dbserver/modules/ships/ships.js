const mongoose = require('mongoose');
const shipSchema = require('./schema');
const {v4: uuidv4} = require('uuid');
const logger = require("../../core/logger");
const CONFIG = require('../../core/config');
const axios = require('axios');
const Ship = mongoose.model('ships', shipSchema);
const SHIP_TYPES = require('./shipTypes');

const DEFAULT_MODULES = {
    weapon: {
        key: "rookie_cannon",
        level: 1,
        category: "modules",
        params: {
            damage: {
                min: 5,
                max: 7
            },
            fireRate: 112,
            energyCost: 1,
            critical: {
                chance: 1,
                modifier: 150
            }
        },
        initialParams: {
            damage: {
                min: 5,
                max: 6
            },
            fireRate: 112,
            critical: {
                chance: 1,
                modifier: 150
            },
            energyCost: 1
        }

    },
    shield: {
        key: "rookie_shield",
        level: 1,
        category: "modules",
        params: {
            shield: {
                capacity: 40,
                regen: 4,
                delay: 1000
            }
        },
        initialParams: {
            shield: {
                capacity: 40,
                regen: 4,
                delay: 1000
            }
        }
    },
    armor: {
        key: "rookie_armor",
        level: 1,
        category: "modules",
        params: {
            armor: {
                capacity: 100
            },
            absorption: {
                chance: 1,
                absorb: 50
            }
        },
        initialParams: {
            armor: {
                capacity: 100
            },
            absorption: {
                chance: 1,
                absorb: 50
            }
        }
    },
    engine: {
        key: "rookie_engine",
        level: 1,
        category: "modules",
        params: {
            speed: 400,
            energy: {
                capacity: 40,
                regen: 6
            },
            evasion: 2
        },
        initialParams: {
            speed: 400,
            energy: {
                capacity: 40,
                regen: 6
            },
            evasion: 2
        }
    }
};

async function createShip(shipId, shipTypeId) {
    if (!SHIP_TYPES[shipTypeId]) {
        throw new Error(`Invalid shipTypeId: ${shipTypeId}`);
    }

    try {

        const existingShip = await Ship.findOne({shipId}).lean();
        if (existingShip) {
            logger.debug(`dbServer: Ship already exists: shipId=${shipId}, typeId=${existingShip.typeId}, type=${existingShip.type}, level=${existingShip.level}, hull=${existingShip.hullPoints}`);
            return existingShip;
        }

        const shipType = SHIP_TYPES[shipTypeId];

        const finalBonuses = {};

        if (shipType.bonuses) {
            for (const bonusKey in shipType.bonuses) {
                const value = shipType.bonuses[bonusKey];

                if (Array.isArray(value) && value.length === 2) {

                    const min = Math.min(value[0], value[1]);
                    const max = Math.max(value[0], value[1]);
                    const randomFloat = Math.random() * (max - min) + min;
                    finalBonuses[bonusKey] = Number(randomFloat.toFixed(1));
                } else if (typeof value === 'number') {

                    finalBonuses[bonusKey] = value;
                }
            }
        }

        const ship = await Ship.create({
            shipId,
            typeId: shipTypeId,
            type: shipType.name,
            level: 1,
            hull: shipType.hullPoints,
            bonuses: finalBonuses,
            modules: {
                weapons: {
                    weapon1: {
                        slotUid: uuidv4(),
                        module: {
                            uid: uuidv4(),
                            ...DEFAULT_MODULES.weapon
                        }
                    },
                    weapon2: {
                        slotUid: uuidv4(),
                        module: {}
                    }
                },
                shield: {
                    slotUid: uuidv4(),
                    module: {
                        uid: uuidv4(),
                        ...DEFAULT_MODULES.shield
                    }
                },
                armor: {
                    slotUid: uuidv4(),
                    module: {
                        uid: uuidv4(),
                        ...DEFAULT_MODULES.armor
                    }
                },
                engine: {
                    slotUid: uuidv4(),
                    module: {
                        uid: uuidv4(),
                        ...DEFAULT_MODULES.engine
                    }
                },
                extra: {
                    extra1: {
                        slotUid: uuidv4(),
                        module: {}
                    },
                    extra2: {
                        slotUid: uuidv4(),
                        module: {}
                    }
                }
            }
        });
        logger.debug(`dbServer: Created ship: shipId=${shipId}, typeId=${shipTypeId}, type=${shipType.name}, level=1, hull=${shipType.hullPoints}`);
        return ship;
    } catch (error) {
        logger.error(`dbServer: Error creating ship for shipId=${shipId}: ${error.message}`);
        throw error;
    }
}

async function getPlayerShips(tokens) {
    if (!Array.isArray(tokens)) {
        throw new Error('Invalid tokens: must be an array');
    }

    try {
        const ships = await Ship.find(
            {shipId: {$in: tokens}},
            {
                _id: 0,
                __v: 0
            }
        ).lean();

        const foundShipIds = ships.map(ship => ship.shipId);
        const missingTokens = tokens.filter(token => !foundShipIds.includes(token));
        if (missingTokens.length > 0) {
            logger.warn(`WARNING! getPlayerShips: Not found ships in DB: ${missingTokens.join(', ')}`, 'ships');
        }

        logger.debug(`dbServer: Fetched ${ships.length} ships for tokens: ${tokens.join(', ')}`);
        return ships;
    } catch (error) {
        logger.error(`dbServer: Error in getPlayerShips: ${error.message}`);
        throw error;
    }
}

async function verifyShipOwnership(shipId, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    if (!Number.isInteger(shipId) || shipId < 0) {
        logger.error(`Invalid shipId: ${shipId}. Must be a non-negative integer`, `ships_${walletAddress}`);
        return {success: false, error: 'Invalid shipId'};
    }
    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        logger.error(`Invalid walletAddress: ${walletAddress}. Must be a valid Ethereum address`, `ships_${walletAddress}`);
        return {success: false, error: 'Invalid walletAddress'};
    }

    try {

        const web3ServerUrl = CONFIG.server.WEB3_SERVER_URL;
        const apiPrefix = CONFIG.server.WEB3_SERVER_INTERNAL_API_PREFIX;
        const url = `${web3ServerUrl}${apiPrefix}/verify-ship/${shipId}/${walletAddress}`;

        const response = await axios.get(url, {
            timeout: 5000
        });

        if (response.status === 200 && response.data.success) {
            return {success: true};
        } else {
            const errorMessage = response.data.reason || 'Ship not owned by this wallet';
            logger.warn(`Ship ${shipId} not owned by ${walletAddress}: ${errorMessage}`, `ships_${walletAddress}`);
            return {success: false, error: errorMessage};
        }
    } catch (error) {
        let errorMessage = 'Failed to verify ship ownership';
        if (error.response) {

            errorMessage = error.response.data.reason || `HTTP ${error.response.status}: ${error.message}`;
        } else if (error.request) {

            errorMessage = 'No response from web3server';
        } else {

            errorMessage = error.message;
        }
        logger.error(`Error verifying ship ${shipId} for ${walletAddress}: ${errorMessage}`, `ships_${walletAddress}`);
        return {success: false, error: errorMessage};
    }
}

async function getModuleDataByUid(shipId, moduleUid, moduleType) {
    try {

        let query = {shipId};
        let projection = {_id: 0};

        let modulePath;
        if (moduleType === 'weapon') {
            modulePath = {
                $or: [
                    {'modules.weapons.weapon1.module.uid': moduleUid},
                    {'modules.weapons.weapon2.module.uid': moduleUid}
                ]
            };
        } else if (moduleType === 'shield') {
            modulePath = {'modules.shield.module.uid': moduleUid};
        } else if (moduleType === 'armor') {
            modulePath = {'modules.armor.module.uid': moduleUid};
        } else if (moduleType === 'engine') {
            modulePath = {'modules.engine.module.uid': moduleUid};
        }

        query = {...query, ...modulePath};

        if (moduleType === 'weapon') {
            projection = {
                'modules.weapons.weapon1.module.key': 1,
                'modules.weapons.weapon1.module.level': 1,
                'modules.weapons.weapon1.module.uid': 1,
                'modules.weapons.weapon2.module.key': 1,
                'modules.weapons.weapon2.module.level': 1,
                'modules.weapons.weapon2.module.uid': 1
            };
        } else {
            projection[`modules.${moduleType}.module.key`] = 1;
            projection[`modules.${moduleType}.module.level`] = 1;
            projection[`modules.${moduleType}.module.uid`] = 1;
        }

        const ship = await Ship.findOne(query, projection).lean();

        if (!ship) {
            logger.warn(`Ship ${shipId} or module with uid ${moduleUid} and type ${moduleType} not found`, 'ships');
            return {success: false, error: 'Module not found'};
        }

        let moduleKey, moduleLevel;
        if (moduleType === 'weapon') {
            const weapon1 = ship.modules.weapons.weapon1.module;
            const weapon2 = ship.modules.weapons.weapon2.module;
            if (weapon1.uid === moduleUid) {
                moduleKey = weapon1.key;
                moduleLevel = weapon1.level;
            } else if (weapon2.uid === moduleUid) {
                moduleKey = weapon2.key;
                moduleLevel = weapon2.level;
            }
        } else {
            const module = ship.modules[moduleType].module;
            if (module.uid === moduleUid) {
                moduleKey = module.key;
                moduleLevel = module.level;
            }
        }

        if (!moduleKey || !moduleLevel) {
            logger.warn(`Module data not found for uid ${moduleUid} and type ${moduleType} in ship ${shipId}`, 'ships');
            return {success: false, error: 'Module data not found'};
        }

        return {
            success: true,
            moduleKey,
            moduleLevel
        };
    } catch (error) {
        logger.error(`Error retrieving module data for shipId ${shipId}, moduleUid ${moduleUid}, moduleType ${moduleType}: ${error.message}`, 'ships');
        return {success: false, error: `Server error: ${error.message}`};
    }
}

module.exports = {Ship, createShip, getPlayerShips, verifyShipOwnership, getModuleDataByUid};