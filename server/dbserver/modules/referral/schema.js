const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({

    referrer: {
        type: String,
        required: true,
        index: true,
        lowercase: true,
        trim: true
    },

    referee: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED'],
        default: 'PENDING'
    },

    createdAt: {type: Date, default: Date.now},

    completedAt: {type: Date}
}, {
    versionKey: false
});

referralSchema.index({referrer: 1, status: 1});
referralSchema.index({referee: 1});

module.exports = referralSchema;