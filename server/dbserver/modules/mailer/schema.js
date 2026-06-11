const mongoose = require('mongoose');
const {Schema} = mongoose;

const attachmentSchema = new Schema(
    {},
    {
        _id: false,
        strict: false
    }
);

const mailSchema = new Schema(
    {

        ownerAddress: {type: String, required: true, index: true, lowercase: true, trim: true},
        folder: {type: String, required: true, enum: ['inbox', 'sent'], default: 'inbox', index: true},

        senderAddress: {type: String, required: true, lowercase: true, trim: true},
        recipientAddress: {type: String, required: true, lowercase: true, trim: true},

        subject: {type: String, required: true, maxlength: 100},
        body: {type: String, default: '', maxlength: 2000},
        isRead: {type: Boolean, default: false},

        hasAttachments: {type: Boolean, default: false},
        attachmentsClaimed: {type: Boolean, default: false},
        attachments: {type: [attachmentSchema], default: []},

        expiresAt: {type: Date, index: {expireAfterSeconds: 0}}
    },
    {
        timestamps: true,
        versionKey: false
    }
);

mailSchema.index({ownerAddress: 1, folder: 1, createdAt: -1});

module.exports = mailSchema;