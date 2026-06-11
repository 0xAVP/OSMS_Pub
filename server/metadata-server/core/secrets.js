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
        const errorMsg = 'APP_MASTER_DECRYPTION_KEY не задан в переменных окружения.';
        logger.error(`[Security] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    let masterKey;

    if (/^[0-9a-fA-F]+$/.test(masterKeyString) && masterKeyString.length === 64) {
        masterKey = Buffer.from(masterKeyString, 'hex');
    } else {

        masterKey = Buffer.from(masterKeyString, 'base64');
    }

    if (masterKey.length !== 32) {
        logger.warn(`[Security] ВНИМАНИЕ: Длина мастер-ключа ${masterKey.length} байт. Для AES-256 ожидается 32 байта. Проверьте APP_MASTER_DECRYPTION_KEY (возможно, он в plain-text, а ожидается base64/hex).`);
    }

    try {

        if (!encryptedData || typeof encryptedData !== 'string') {
            throw new Error(`В decryptSecret переданы невалидные данные: ${typeof encryptedData}`);
        }

        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Неверный формат зашифрованных данных. Ожидается iv:authTag:encryptedHex');
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

        const dataSnippet = encryptedData ? encryptedData.substring(0, 15) + '...' : 'null';

        logger.error('[Security] КРИТИЧЕСКАЯ ОШИБКА РАСШИФРОВКИ.', {
            message: error.message,
            algorithm: CONFIG.security.vault.ENCRYPT_ALGORITHM,
            dataSnippet: dataSnippet,
            reason: 'Скорее всего, данные зашифрованы ДРУГИМ ключом, или APP_MASTER_DECRYPTION_KEY неверен.'
        });
        throw new Error(`Failed to decrypt data (${dataSnippet}): ${error.message}`);
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

        logger.error('[Infisical] Critical error during initialization.', {
            message: error.message,
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

            return {name: secretNameInInfisical, value: secretData.secretValue};

        } catch (error) {
            logger.error(`[Infisical] Failed to fetch secret "${secretNameInInfisical}".`, {
                message: error.message
            });
            return null;
        }
    });

    let results = await Promise.all(secretPromises);

    let allSecretsFetched = true;
    for (const secret of results) {
        if (secret) {
            secretsCache.set(secret.name, secret.value);

        } else {
            allSecretsFetched = false;
        }
    }

    if (!allSecretsFetched) {
        throw new Error("One or more required secrets could not be fetched from Infisical.");
    }
}

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
