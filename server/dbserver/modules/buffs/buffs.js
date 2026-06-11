const mongoose = require('mongoose');
const buffSchema = require('./schema');

const Buff = mongoose.model('buffs', buffSchema);

module.exports = {Buff};