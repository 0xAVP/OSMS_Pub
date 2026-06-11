const mongoose = require('mongoose');

const baseSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    base: {
        level: {type: Number, default: 1},
        hp: {type: Number, default: 100}
    }
});

module.exports = baseSchema;