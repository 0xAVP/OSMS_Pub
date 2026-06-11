const express = require('express');
const CONFIG = require('./core/config');
const healthMonitor = require('./core/healthMonitor');
const {getAllModules} = require('./catalog/catalog');
const {BONUS_NAME_MAP} = require('./modules/ships/bonuses');
const INTERNAL_API_PORT = CONFIG.server.INTERNAL_API_PORT;

function verifyInternalRequest(req, res, next) {

    const clientIp = req.ip;

    const whitelist = CONFIG.security.INTERNAL_API_WHITELIST || [];

    if (whitelist.includes(clientIp)) {

        next();
    } else {
        console.warn(`[CatalogAPI-SECURITY] Отклонен запрос от недоверенного IP: ${clientIp}`);
        res.status(403).json({success: false, error: 'Access Denied'});
    }
}

function startCatalogApiServer() {
    const app = express();

    app.use(require('cors')());

    app.get('/health', async (req, res) => {
        const data = await healthMonitor.getSystemHealth();

        const code = data.status === 'error' ? 503 : 200;
        res.status(code).json(data);
    });

    app.use('/internal/api/v1/catalogs', verifyInternalRequest);

    app.get('/internal/api/v1/catalogs/modules', (req, res) => {
        try {
            console.log(`[CatalogAPI] Поступил запрос на получение каталога модулей от ${req.ip}`);

            const modulesCatalog = getAllModules();

            if (!modulesCatalog) {
                console.error('[CatalogAPI] Каталог модулей еще не загружен!');
                return res.status(503).json({success: false, error: 'Catalog not available yet'});
            }

            res.status(200).json({success: true, data: {modules: modulesCatalog}});

        } catch (error) {
            console.error(`[CatalogAPI] Ошибка при отдаче каталога модулей: ${error.message}`);
            res.status(500).json({success: false, error: 'Failed to retrieve modules catalog'});
        }
    });

    app.get('/internal/api/v1/catalogs/shipsbonuses', (req, res) => {
        try {
            console.log(`[CatalogAPI] Поступил запрос на получение маппинга бонусов от ${req.ip}`);

            if (!BONUS_NAME_MAP) {
                console.error('[CatalogAPI] Маппинг бонусов не загружен!');
                return res.status(503).json({success: false, error: 'Bonus name map not available'});
            }

            res.status(200).json({success: true, data: {bonuses: BONUS_NAME_MAP}});

        } catch (error) {
            console.error(`[CatalogAPI] Ошибка при отдаче маппинга бонусов: ${error.message}`);
            res.status(500).json({success: false, error: 'Failed to retrieve bonus name map'});
        }
    });

    const httpServer = app.listen(INTERNAL_API_PORT, () => {
        console.log(`[CatalogAPI] Внутренний HTTP API для каталогов запущен на порту ${INTERNAL_API_PORT}`);
    });

    return httpServer;
}

module.exports = {startCatalogApiServer};

