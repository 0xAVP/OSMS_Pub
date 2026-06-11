const mongoose = require('mongoose');

/**
 * Схема для хранения активных баффов игроков.
 * Каждый документ представляет один активный бафф (или группу баффов) для одного игрока.
 */
const buffSchema = new mongoose.Schema({

    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },

    buffId: {
        type: String,
        required: true
    },

    group: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true
    }
}, {

    timestamps: true,

    versionKey: false
});

buffSchema.index({walletAddress: 1, group: 1}, {unique: true});

buffSchema.index({"expiresAt": 1}, {expireAfterSeconds: 0});

module.exports = buffSchema;