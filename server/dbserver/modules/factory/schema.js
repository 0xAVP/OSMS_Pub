const mongoose = require('mongoose');
const {v4: uuidv4} = require('uuid');

const factoryItemSchema = new mongoose.Schema({
    factoryUid: {type: String, required: true, default: uuidv4},
    state: {type: String, enum: ['idle', 'crafting'], required: true, default: 'idle'},
    blueprintKey: {type: String, required: false, default: null},
    quantity: {type: Number, required: false, default: null},
    startTime: {type: Number, required: false, default: null},
    endTime: {type: Number, required: false, default: null},
    timeRemainingMs: {type: Number, required: false, default: null}
}, {
    _id: false,
    versionKey: false
});

const factoriesSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },

    factories: {
        type: {
            factory1: {type: factoryItemSchema, default: () => ({})},
            factory2: {type: factoryItemSchema, default: () => ({})},
            factory3: {type: factoryItemSchema, default: () => ({})}
        },

        default: () => ({
            factory1: {factoryUid: uuidv4(), state: 'idle'},
            factory2: {factoryUid: uuidv4(), state: 'idle'},
            factory3: {factoryUid: uuidv4(), state: 'idle'}
        })
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = factoriesSchema;
