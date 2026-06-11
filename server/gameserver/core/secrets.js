const {InfisicalSDK} = require('@infisical/sdk');
const CONFIG = require('./config');
const logger = require('./logger');
const crypto = require('crypto');

let client;
const secretsCache = new Map();

/**
 * Расшифровывает данные, используя мастер-ключ из конфигурации (ENV).
 * @param {string} encryptedData - Строка формата 'iv:authTag:encryptedHex'
 * @returns {Promise<string>} - Расшифрованные данные.
 */
async function decryptSecret(encryptedData) {

    const masterKeyString = CONFIG.security.vault.MASTER_KEY;

    if (!masterKeyString) {
        const errorMsg = 'APP_MASTER_DECRYPTION_KEY не задан в переменных окружения. Расшифровка невозможна.';
        logger.error(`[Security] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    const masterKey = Buffer.from(masterKeyString, 'base64');

    try {

        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Неверный формат зашифрованных данных.');
        }

        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(CONFIG.security.vault.ENCRYPT_ALGORITHM, masterKey, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error('[Security] КРИТИЧЕСКАЯ ОШИБКА РАСШИФРОВКИ.', {message: error.message});
        throw new Error('Failed to decrypt data.');
    }

}

async function initializeSecrets() {
    let {CLIENT_ID, CLIENT_SECRET: clientSecret} = CONFIG.security.infisical;

    if (!CLIENT_ID || !clientSecret) {
        throw new Error('Учетные данные Infisical (CLIENT_ID, CLIENT_SECRET) не настроены.');
    }

    try {
        client = new InfisicalSDK({
            siteUrl: "https://eu.infisical.com"
        });

        await client.auth().universalAuth.login({
            clientId: CLIENT_ID,
            clientSecret: clientSecret
        });

        clientSecret = null;
        CLIENT_ID = null;

        await prefetchSecrets();

    } catch (error) {

        clientSecret = null;
        CLIENT_ID = null;

        logger.error('[Infisical] A critical error occurred during secrets initialization.', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });
        throw error;
    }
}

async function prefetchSecrets() {
    const {PROJECT_ID, secrets: requiredSecretsConfig} = CONFIG.security.infisical;

    const secretPromises = Object.keys(requiredSecretsConfig).map(async (internalKey) => {
        const secretNameInInfisical = requiredSecretsConfig[internalKey];

        try {
            const secretData = await client.secrets().getSecret({
                projectId: PROJECT_ID,
                environment: CONFIG.server.NODE_ENV,
                secretName: secretNameInInfisical,
            });

            if (!secretData || !secretData.secretValue) {

                logger.warn(`[Infisical] CRITICAL: Required secret "${secretNameInInfisical}" was not found.`);
                return null;
            }

            const result = {name: secretNameInInfisical, value: secretData.secretValue};
            secretData.secretValue = null;
            return result;

        } catch (error) {

            logger.error(`[Infisical] Failed to fetch secret "${secretNameInInfisical}".`, {
                message: error.message,
                response: error.response?.data
            });
            return null;
        }
    });

    let results = await Promise.all(secretPromises);

    let allSecretsFetched = true;
    for (const secret of results) {
        if (secret) {
            secretsCache.set(secret.name, secret.value);
            secret.value = null;
        } else {
            allSecretsFetched = false;
        }
    }

    results = null;

    if (!allSecretsFetched) {
        throw new Error("One or more required secrets could not be fetched from Infisical. Check logs for details.");
    }
}

/**
 * Извлекает значение секрета из кэша в памяти.
 */
function getSecret(secretName) {
    if (!client) {

        logger.error('[Infisical] getSecret called before client was initialized.');
        return null;
    }
    if (!secretsCache.has(secretName)) {

        logger.warn(`[Infisical] Secret "${secretName}" not found in cache.`);
        return null;
    }
    return secretsCache.get(secretName);
}

/**
 * Очищает все загруженные секреты из кэша в памяти.
 */
function clearSecretsCache() {
    secretsCache.clear();
    console.log('[Infisical] Cleared during shutdown.');
}

module.exports = {
    initializeSecrets,
    getSecret,
    decryptSecret,
    clearSecretsCache
};