const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    nickname: {type: String, required: true},
    exp: {type: Number, default: 0},
    registered: {type: Date, default: Date.now},
    referralCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    }
});

module.exports = playerSchema;