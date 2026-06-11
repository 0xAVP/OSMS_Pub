const mongoose = require('mongoose');

const boosterSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    expBooster: {
        boost: {type: Number, default: 1},
        expiry: {type: Date, default: null}
    }
});

module.exports = boosterSchema;