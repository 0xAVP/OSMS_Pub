const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
    {
        uid: {type: String, default: null},
        key: {type: String},
        name: {type: String},
        category: {type: String},
        level: {type: Number, min: 1},
        params: {type: mongoose.Schema.Types.Mixed, default: {}},
        initialParams: {type: mongoose.Schema.Types.Mixed, default: {}},
        _id: false
    },
    {_id: false}
);

const slotSchema = new mongoose.Schema(
    {
        slotUid: {type: String, required: true},
        module: {type: moduleSchema, default: {}},
        _id: false
    },
    {_id: false}
);

const shipSchema = new mongoose.Schema({
    shipId: {type: Number, required: true, unique: true, index: true},
    typeId: {type: Number, required: true},
    type: {type: String, required: true},
    level: {type: Number, required: true},
    hull: {type: Number, default: 0},
    bonuses: {type: mongoose.Schema.Types.Mixed, default: {}},
    modules: {
        weapons: {
            weapon1: {type: slotSchema, required: true},
            weapon2: {type: slotSchema, required: true}
        },
        shield: {type: slotSchema, required: true},
        armor: {type: slotSchema, required: true},
        engine: {type: slotSchema, required: true},
        extra: {
            extra1: {type: slotSchema, required: true},
            extra2: {type: slotSchema, required: true}
        }
    }
});

shipSchema.index({'modules.weapons.weapon1.module.uid': 1}, {sparse: true});
shipSchema.index({'modules.weapons.weapon2.module.uid': 1}, {sparse: true});
shipSchema.index({'modules.shield.module.uid': 1}, {sparse: true});
shipSchema.index({'modules.armor.module.uid': 1}, {sparse: true});
shipSchema.index({'modules.engine.module.uid': 1}, {sparse: true});
shipSchema.index({'modules.extra.extra1.module.uid': 1}, {sparse: true});
shipSchema.index({'modules.extra.extra2.module.uid': 1}, {sparse: true});

module.exports = shipSchema;