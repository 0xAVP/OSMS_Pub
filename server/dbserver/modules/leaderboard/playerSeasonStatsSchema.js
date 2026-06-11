const mongoose = require('mongoose');
const {Schema} = mongoose;

/**
 * Схема для хранения итоговой статистики игрока за один сезон.
 * Каждый документ представляет собой запись о лучших достижениях одного игрока в одном сезоне.
 */
const playerSeasonStatsSchema = new Schema(
    {

        walletAddress: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
            trim: true
        },

        seasonNumber: {
            type: Number,
            required: true,
            index: true
        },

        bestKills: {
            type: Number,
            default: 0
        },

        maxStage: {
            type: Number,
            default: 0
        }

    },
    {

        timestamps: true,

        versionKey: false
    }
);

playerSeasonStatsSchema.index({seasonNumber: 1, walletAddress: 1}, {unique: true});

module.exports = playerSeasonStatsSchema;