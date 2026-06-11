const mongoose = require('mongoose');

const reservedItemSchema = new mongoose.Schema({
    quantity: {type: Number, required: true},
    category: {type: String, required: true}
}, {_id: false});

const reservationSchema = new mongoose.Schema({
    craftId: {type: String, required: true, unique: true, index: true},
    walletAddress: {
        type: String,
        required: true,
        unique: false,
        index: true,
        lowercase: true,
        trim: true
    },
    shipTypeId: {type: Number, required: true},
    status: {
        type: String,
        enum: ['RESERVED', 'FINALIZED', 'EXPIRED', 'FAILED'],
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