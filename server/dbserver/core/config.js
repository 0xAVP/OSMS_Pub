module.exports = {
    server: {
        NODE_ENV: process.env.NODE_ENV,
        TRUST_PROXY: process.env.TRUST_PROXY === 'true' || false,
        PORT: 3003,
        WEB3_SERVER_URL: process.env.WEB3_SERVER_URL,
        INTERNAL_API_PORT: 30031,
        WORKER_CORES_TO_USE: 1,
        WEB3_SERVER_INTERNAL_API_PREFIX: '/internal/api/v1'
    },

    database: {

        MONGO_URI_START: process.env.MONGO_URI_START || "mongodb://",
        MONGO_URI_END: process.env.MONGO_URI_END || "@localhost:27017/OSMS?authSource=admin",
        REDIS_URI: process.env.REDIS_URI || "redis://localhost:6379",
    },

    security: {
        SESSION_TOKEN_EXPIRY_MS: 3600 * 1000,
        SHORT_LIVED_SESSION_MS: 15 * 60 * 1000,
        SERVER_WHITELISTED_IPS: [
            '127.0.0.1',
            '::1',
            '::ffff:127.0.0.1',
            '100.70.115.81',
            '::ffff:100.70.115.81',
            '100.106.100.125',
            '::ffff:100.106.100.125',
        ],
        INTERNAL_API_WHITELIST: [
            '127.0.0.1',
            '::1',
            '::ffff:127.0.0.1',
            '100.70.115.81',
            '::ffff:100.70.115.81',
        ],
        MAX_MESSAGE_SIZE_BYTES: 2000,
        IDENTIFY_TIMEOUT_MS: 10000,
        MAX_UNKNOWN_MESSAGES_BEFORE_CLOSE: 3,
        infisical: {
            CLIENT_ID: process.env.INFISICAL_CLIENT_ID,
            CLIENT_SECRET: process.env.INFISICAL_CLIENT_SECRET,
            PROJECT_ID: process.env.INFISICAL_PROJECT_ID,
            secrets: {
                ENCRYPTED_DB_CRED: 'ENCRYPTED_DB_CRED',
                ENCRYPTED_REDIS_PASSWORD: 'ENCRYPTED_REDIS_PASSWORD',
                GS_CLIENT_ID: 'GS_CLIENT_ID',
                WEB3_CLIENT_ID: 'WEB3_CLIENT_ID'
            }
        },
        vault: {
            MASTER_KEY: process.env.APP_MASTER_DECRYPTION_KEY,
            ENCRYPT_ALGORITHM: process.env.ENCRYPT_ALGORITHM,
        }
    },

    rateLimits: {
        cleanupIntervalMs: 60 * 1000,
        limits: {
            unknown: {maxMessages: 5, windowMs: 60 * 1000},
            client: {maxMessages: 100, windowMs: 60 * 1000},
            startCraft: {maxMessages: 1, windowMs: 2 * 1000},
            moduleUpgrade: {maxMessages: 1, windowMs: 2 * 1000}
        },
    },
};

