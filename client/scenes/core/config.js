const LOCAL_PORTS = {
    WEB3_SERVER: 3000,
    GAME_SERVER: 3002,
    DB_SERVER: 3003,
};

const SERVER_WEB3 = import.meta.env.VITE_W3GATE || `http://26.248.184.178:${LOCAL_PORTS.WEB3_SERVER}`;

const SERVER_GAME = import.meta.env.VITE_GS1 || `ws://26.248.184.178:${LOCAL_PORTS.GAME_SERVER}`;

const SERVER_DB = import.meta.env.VITE_APISERVER || `ws://26.248.184.178:${LOCAL_PORTS.DB_SERVER}`;

export const CONFIG = {
    VERSION: 'a0.3.27-c',

    servers: {
        web3: SERVER_WEB3,
        game: SERVER_GAME,
        db: SERVER_DB,
    },

    blockchain: {
        PILOT_NFT_ADDRESS: import.meta.env.VITE_PILOT_NFT_ADDRESS || null,
        SHIP_NFT_ADDRESS: import.meta.env.VITE_SHIP_NFT_ADDRESS || null,
        SHIP_MANAGER_ADDRESS: import.meta.env.VITE_SHIP_MANAGER_ADDRESS || null,
        TOKEN_MINTER_ADDRESS: import.meta.env.VITE_TOKEN_MINTER_ADDRESS || null,
        OSMS_TOKEN_ADDRESS: import.meta.env.VITE_OSMS_TOKEN_ADDRESS || null,
    },

    gameplay: {
        SERVER_WATCHDOG: 1000,
        FIXED_STEP_MS: 30,

        INPUT_SEND_INTERVAL_MS: 100,

        PING_INTERVAL_MS: 1000,

        interpolation: {
            ENEMY_INTERP_FACTOR: 0.2,

        },

        player: {

            ENERGY_LERP_FACTOR: 0.1,
        },
        enemies: {

            HITBOX_OFFSET_RATIO: 0.2,
        }
    },

    client: {

        hangar: {
            MAX_PILOTS_TO_PRELOAD: 8,
            SESSION_BUFFER_TIME_MS: 300000,
            SESSION_DURATION_MS: 3600 * 1000,
            SESSION_FRESHNESS_MS: 10 * 60 * 1000
        },

        pools: {
            PLAYER_BULLET_SIZE: 200,
            ENEMY_BULLET_SIZE: 200,
        },

        validation: {
            MIN_CANVAS_WIDTH: 1024,
            MIN_CANVAS_HEIGHT: 660,
            MAX_CANVAS_WIDTH: 3840,
            MAX_CANVAS_HEIGHT: 2160,
            FETCHING_TIMEOUT_MS: 20000,
        }
    },
};