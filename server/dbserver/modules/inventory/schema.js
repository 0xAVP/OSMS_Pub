const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
    {
        key: {type: String, required: true},
        level: {type: Number, default: 1, min: 1},
        quantity: {type: Number, default: 1, min: 1, max: 1},
        category: {type: String, default: 'modules'},
        params: {type: mongoose.Schema.Types.Mixed, default: {}},
        initialParams: {type: mongoose.Schema.Types.Mixed, default: {}},
        _id: false
    },
    {_id: false}
);

const inventorySchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    resources: {
        type: Map,
        of: {
            quantity: {type: Number, default: 0, min: 0},
            _id: false
        },
        default: () => new Map()
    },
    blueprints: {
        type: Map,
        of: {
            quantity: {type: Number, default: 0, min: 0},
            _id: false
        },
        default: () => new Map()
    },
    modules: {
        type: Map,
        of: moduleSchema,
        default: () => new Map()
    },
    components: {
        type: Map,
        of: {
            quantity: {type: Number, default: 0, min: 0},
            _id: false
        },
        default: () => new Map()
    },
    stagestones: {
        type: Map,
        of: {
            quantity: {type: Number, default: 0, min: 0},
            _id: false
        },
        default: () => new Map()
    },
    hulls: {
        type: Map,
        of: {
            quantity: {type: Number, default: 0, min: 0},
            _id: false
        },
        default: () => new Map()
    },

    other: {
        type: Map,
        of: {
            quantity: {type: Number, default: 0, min: 0},
            _id: false
        },
        default: () => new Map()
    }
});

module.exports = inventorySchema;