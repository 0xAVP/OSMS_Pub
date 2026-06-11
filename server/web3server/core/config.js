module.exports = {
    server: {
        NODE_ENV: process.env.NODE_ENV || 'dev',
        PORT: 3000,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        BODY_LIMIT: '1kb'
    },

    connections: {
        DB_SERVER_URL: process.env.DB_SERVER_URL,
        DB_SERVER_REC_TIMEOUT_MS: 1000,
        DB_CONNECTION_POLL_INTERVAL_MS: 1000,
        redis: {

            REDIS_URI: process.env.REDIS_URI,
            REDIS_PILOT_OWNERS_KEY: 'pilot_owners_list',
        }
    },

    blockchain: {

        env: {
            ECHO_NFT_ADDRESS: process.env.ECHO_NFT_ADDRESS,
            SHIP_NFT_ADDRESS: process.env.SHIP_NFT_ADDRESS,
            SHIP_MANAGER_ADDRESS: process.env.SHIP_MANAGER_ADDRESS,
            TOKEN_MINTER_ADDRESS: process.env.TOKEN_MINTER_ADDRESS,
            INFURA_RPC_URL: process.env.INFURA_RPC_URL,
            ALCHEMY_API_URL: process.env.ALCHEMY_API_URL,
            ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
        },

        RECONNECT_TIMEOUT_MS: 10000,
        PING_INTERVAL_MS: 59000,
    },

    security: {
        INTERNAL_API_WHITELIST: [
            '127.0.0.1',
            '::1',
            '::ffff:127.0.0.1',
            '100.106.100.125',
            '::ffff:100.106.100.125',
            '100.123.73.85',
            '::ffff:100.123.73.85',
        ],
        infisical: {
            CLIENT_ID: process.env.INFISICAL_CLIENT_ID,
            CLIENT_SECRET: process.env.INFISICAL_CLIENT_SECRET,
            PROJECT_ID: process.env.INFISICAL_PROJECT_ID,
            secrets: {
                ENCRYPTED_SIGNER_PKEY: 'ENCRYPTED_SIGNER_PKEY',
                ENCRYPTED_REDIS_PASSWORD: 'ENCRYPTED_REDIS_PASSWORD',
                WEB3_CLIENT_ID: 'WEB3_CLIENT_ID',
            }
        },
        vault: {
            MASTER_KEY: process.env.APP_MASTER_DECRYPTION_KEY,
            ENCRYPT_ALGORITHM: process.env.ENCRYPT_ALGORITHM,
        }
    },

    rateLimit: {
        WINDOW_MS: 10 * 60 * 1000,
        MAX_REQUESTS: 100,
        RATE_LIMIT_IP_WHITELIST: ['::1', '127.0.0.1'],
    },
    timeouts: {
        DB_RESPONSE_TIMEOUT_MS: 5000,
    },

    game: {
        PILOT_OWNERS_UPDATE_INTERVAL_MS: 60 * 1000,
    }
};