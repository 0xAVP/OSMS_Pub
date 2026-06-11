module.exports = {
    networkSimulation: {
        enabled: true,
        baseLatencyMs: 75,
        jitterMs: 10,
        packetLossChance: 0
    },

    server: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: 3002,
        ORIGIN_CLIENT_URL: process.env.ORIGIN_CLIENT_URL,
        UPDATE_INTERVAL_MS: 30,
        MAX_MESSAGE_SIZE_BYTES: 2048,
        ENEMY_UPDATE_FREQUENCY_TICKS: 7,
        GAME_TIME_UPDATE_INTERVAL_MS: 1000,
        PING_INTERVAL_MS: 1000,
        RECONNECT_GRACE_PERIOD_MS: 60000

    },

    cluster: {
        FORK_DELAY_MS: 2000,
        RESTART_DELAY_MS: 5000,
    },

    connections: {
        REDIS_URI: process.env.REDIS_URI || "redis://localhost:6379",
        dbServer: {
            URL: process.env.DB_SERVER_URI,
            RECONNECT_TIMEOUT_MS: 2000,
            RESPONSE_TIMEOUT_MS: 5000,
        },
        web3Server: {
            URL: process.env.WEB3_SERVER_URI,
            REQUEST_TIMEOUT_MS: 10000,
            MAX_RETRIES: 3,
            RETRY_DELAY_MS: 1000
        }
    },

    game: {
        PREPARATION_COUNTDOWN_MS: 4000,
        GOD_MODE_ENABLED: true,
        FORCE_DEFAULT_STAGE: true,
        STAGE_LEVEL: 1,
        PLAYER_WEAPON_SWITCH_COOLDOWN_MS: 5000,
        ENEMY_WEAPON_CHANGE_INTERVAL_MS: 2000,
        COLLISION_COOLDOWN_MS: 500,
        CRITICAL_HIT_STUN_DURATION_MS: 2000,
        STUN_IMMUNITY_DURATION_MS: 10000,
        SPAWN_COLLISION_INVULNERABILITY_MS: 3000,
        spawn: {
            X_OFFSET: 10,
            Y_OFFSET: 50,

        },
        worldBoundsBuffer: {
            top: 100,
            right: 60,
            bottom: 50,
            left: 50
        },

        antiCheat: {

            POSITION_TOLERANCE_PX: 15
        }
    },

    performance: {
        CLIENT_RENDER_DELAY_MS: 300,
        HEARTBEAT_CHECK_INTERVAL_MS: 1000,
        HEARTBEAT_TIMEOUT_MS: 5000,
        ENEMY_BULLET_POOL_SIZE: 200,
        ENEMY_COMPONENT_POOL_SIZE: 100,
        POSITION_CORRECTION_INTERVAL_MS: 1000,
        HISTORY_BUFFER_CAPACITY: 200,
        GRID_CELL_SIZE: 200
    },

    validation: {
        WALLET_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
        SESSION_TOKEN_MAX_LENGTH: 64,
        MAX_ACTIONS_PER_PACKET: 10,
        MAX_FLIGHT_TIME_MS: 6000,
        PLAYER_ACTIONS_TTL: 6100,
        TIMESTAMP_TOLERANCE_MS: 1000,
        world: {
            MIN_WIDTH: 1024,
            MIN_HEIGHT: 660,
            MAX_WIDTH: 3840,
            MAX_HEIGHT: 2160
        },
        rules: {
            MAX_MAP_ID: 2,
            MAX_PILOT_ID: 1000,
        },

        scaling: {
            REFERENCE_WIDTH: 1920.0,
            REFERENCE_HEIGHT: 1080.0
        }
    },

    security: {
        infisical: {
            CLIENT_ID: process.env.INFISICAL_CLIENT_ID,
            CLIENT_SECRET: process.env.INFISICAL_CLIENT_SECRET,
            PROJECT_ID: process.env.INFISICAL_PROJECT_ID,
            secrets: {
                GS_CLIENT_ID: 'GS_CLIENT_ID',
                ENCRYPTED_REDIS_PASSWORD: 'ENCRYPTED_REDIS_PASSWORD'
            }
        },
        vault: {
            MASTER_KEY: process.env.APP_MASTER_DECRYPTION_KEY,
            ENCRYPT_ALGORITHM: process.env.ENCRYPT_ALGORITHM,
        }
    }
};