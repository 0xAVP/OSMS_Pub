const mongoose = require('mongoose');

const reservedItemSchema = new mongoose.Schema({
    quantity: {type: Number, required: true},
    category: {type: String, required: true}
}, {_id: false});

const reservationSchema = new mongoose.Schema({

    reservationId: {type: String, required: true, unique: true, index: true},

    type: {
        type: String,
        enum: ['SHIP_CRAFT', 'TOKEN_CLAIM'],
        required: true
    },

    walletAddress: {
        type: String,
        required: true,
        index: true,
        lowercase: true,
        trim: true
    },

    shipTypeId: {
        type: Number,
        required: false
    },

    coinsAmount: {
        type: Number,
        required: false
    },

    epoch: {
        type: Number,
        required: false
    },

    status: {
        type: String,
        enum: ['RESERVED', 'FINALIZED', 'EXPIRED', 'FAILED', 'REFUNDED'],
        default: 'RESERVED',
        index: true
    },

    processingAttempts: {type: Number, default: 0},

    expiresAt: {type: Date, required: true},

    transactionHash: {type: String, required: false, index: true, unique: true, sparse: true},

    items: {
        type: Map,
        of: reservedItemSchema
    }
}, {timestamps: true});

reservationSchema.index({"expiresAt": 1}, {expireAfterSeconds: 3600 * 24 * 7});

module.exports = mongoose.model('Reservation', reservationSchema);