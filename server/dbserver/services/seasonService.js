const fs = require('fs');
const path = require('path');
const SEASONS_CONFIG_PATH = path.join(__dirname, 'seasons.json');

class SeasonService {

    constructor() {
        this.allSeasons = [];
        this.activeSeason = null;
    }

    initialize() {
        try {
            const fileContent = fs.readFileSync(SEASONS_CONFIG_PATH, 'utf-8');
            this.allSeasons = JSON.parse(fileContent);
            if (!Array.isArray(this.allSeasons)) {
                throw new Error("Конфигурационный файл сезонов должен содержать массив объектов.");
            }
            const now = new Date();
            this.activeSeason = this.allSeasons.find(season => {
                const startDate = new Date(season.startDate);
                const endDate = new Date(season.endDate);

                return now >= startDate && now <= endDate;
            }) || null;

            if (this.activeSeason) {
                console.log(`[SeasonService] Инициализация успешна. Активный сезон: №${this.activeSeason.seasonNumber}`);
            } else {
                console.warn('[SeasonService] Внимание: Активный сезон не найден. Сервер работает в режиме межсезонья.');
            }

        } catch (error) {
            console.error(`[SeasonService] КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить или обработать seasons.json. Ошибка: ${error.message}`);
            throw error;
        }
    }

    getActiveSeason() {
        return this.activeSeason;
    }

    getActiveSeasonNumber() {
        return this.activeSeason ? this.activeSeason.seasonNumber : null;
    }

    getSeasonByNumber(seasonNumber) {
        return this.allSeasons.find(s => s.seasonNumber === seasonNumber);
    }

    getLatestConcludedSeason() {
        const now = new Date();
        const pastSeasons = this.allSeasons.filter(season => new Date(season.endDate) < now);
        if (pastSeasons.length === 0) {
            return null;
        }

        pastSeasons.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
        return pastSeasons[0];
    }

}

module.exports = new SeasonService();