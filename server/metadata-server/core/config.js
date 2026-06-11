const PORTS = {
    INTERNAL_API_PORT: process.env.INTERNAL_API_PORT,
    METADATA_SERVER_PORT: process.env.PORT,
};

module.exports = {
    server: {
        PORT: PORTS.METADATA_SERVER_PORT,
        NODE_ENV: process.env.NODE_ENV
    },
    connections: {
        CATALOG_MODULES_API_URL: process.env.CATALOG_MODULES_API_URL,
        CATALOG_BONUSES_API_URL: process.env.CATALOG_BONUSES_API_URL,
        REDIS_URI: process.env.REDIS_URI
    },
    database: {
        MONGO_URI_START: process.env.MONGO_URI_START,
        MONGO_URI_END: process.env.MONGO_URI_END
    },
    security: {
        infisical: {
            CLIENT_ID: process.env.INFISICAL_CLIENT_ID,
            CLIENT_SECRET: process.env.INFISICAL_CLIENT_SECRET,
            PROJECT_ID: process.env.INFISICAL_PROJECT_ID,
            secrets: {
                ENCRYPTED_DB_CRED: 'ENCRYPTED_DB_CRED',
                ENCRYPTED_REDIS_PASSWORD: 'ENCRYPTED_REDIS_PASSWORD'
            }
        },
        vault: {
            MASTER_KEY: process.env.APP_MASTER_DECRYPTION_KEY,
            ENCRYPT_ALGORITHM: process.env.ENCRYPT_ALGORITHM,
        }
    },
    logic: {
        CATALOG_FETCH_RETRY_DELAY_MS: 5000,
        METADATA_CACHE_KEY_PREFIX: 'metadata:',
        METADATA_CACHE_TTL_SECONDS: 10 * 60,
        ENABLE_ETAG_SUPPORT: process.env.ENABLE_ETAG_SUPPORT === 'true',

        LOCK_PREFIX: 'lock:',
        CHANNEL_PREFIX: 'channel:',
        LOCK_TTL_SECONDS: 15,
        GENERATION_TIMEOUT_MS: 10000,
    }
};