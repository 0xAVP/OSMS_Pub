module.exports = {
    server: {
        NODE_ENV: process.env.NODE_ENV || 'dev'
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
    connections: {
        REDIS_URI: process.env.REDIS_URI || "redis://localhost:6379",
    },
    database: {
        MONGO_URI_START: process.env.MONGO_URI_START,
        MONGO_URI_END: process.env.MONGO_URI_END
    },

    PILOT_OWNERS_REDIS_KEY: 'pilot_owners_list',
    EXP_TO_ACCRUE: 10,
    CRON_SCHEDULE: '*/10 * * * *'
};