const mongoose = require('mongoose');
const mailSchema = require('./schema');

const Mail = mongoose.model('mails', mailSchema);

module.exports = Mail;