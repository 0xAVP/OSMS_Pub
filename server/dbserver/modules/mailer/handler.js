const mongoose = require('mongoose');
const Mail = require('./mail');
const {validate} = require('uuid');
const {getItemData} = require('../../catalog/catalog');
const {Inventory} = require('../inventory/inventory');
const {getPlayerByWalletAddress} = require('../player/player');
const logger = require('../../core/logger');
const {logCraftAttempt} = require("../../core/auditLogger");

async function sendItem(payload, senderAddress) {

    const {itemKey, itemUid, quantity} = payload;

    senderAddress = senderAddress?.toLowerCase();
    let recipientAddress = payload.recipientAddress?.toLowerCase();

    if (!recipientAddress || !/^0x[a-f0-9]{40}$/.test(recipientAddress)) {
        return {success: false, error: "Invalid recipient address."};
    }

    if (senderAddress === recipientAddress) {
        return {success: false, error: "You cannot send items to yourself."};
    }

    const recipient = await getPlayerByWalletAddress(recipientAddress);
    if (!recipient) {
        return {success: false, error: "Recipient not found."};
    }

    const itemDataFromCatalog = getItemData(itemKey);
    if (!itemDataFromCatalog) {
        logger.error(`Attempt to send non-existent item: ${itemKey}`, `mail_${senderAddress}`);
        return {success: false, error: "Item not found in catalog."};
    }

    if (!itemDataFromCatalog.attributes || !itemDataFromCatalog.attributes.isTradable) {
        logger.error(`Attempt to send non-tradable item: ${itemKey}`, `mail_${senderAddress}`);
        return {success: false, error: "Item is not tradable."};
    }

    const serverCategory = itemDataFromCatalog.category;

    if (serverCategory === 'modules') {
        if (!itemUid || !validate(itemUid)) return {success: false, error: 'A valid UID is required for modules.'};
        if (quantity !== 1) return {success: false, error: 'Quantity must be 1 for modules.'};
    } else {
        if (itemUid) return {success: false, error: 'UID should not be provided for stackable items.'};
    }

    const session = await mongoose.startSession();
    try {
        let finalResult;
        await session.withTransaction(async () => {

            const inventory = await Inventory.findOne({walletAddress: senderAddress}).session(session);
            if (!inventory) {
                throw new Error("Sender inventory not found.");
            }

            if (serverCategory === 'hulls') {
                logCraftAttempt('ITEM_CONSUMED', {
                    walletAddress: senderAddress,
                    details: {
                        itemKey: itemKey,
                        category: serverCategory,
                        quantity: quantity,
                        reason: "Sent via mail",
                        recipient: recipientAddress
                    }
                });
            }

            let itemDataForAttachment;
            let finalQuantity = quantity;

            if (serverCategory === 'modules') {
                const moduleInInventory = inventory.modules.get(itemUid);
                if (!moduleInInventory || moduleInInventory.key !== itemKey) {
                    throw new Error('Module not found in inventory.');
                }

                itemDataForAttachment = {

                    itemUid: itemUid,
                    category: serverCategory,

                    data: moduleInInventory.toObject()
                };

                finalQuantity = 1;
                inventory.modules.delete(itemUid);

            } else {
                const item = inventory[serverCategory].get(itemKey);
                if (!item || item.quantity < quantity) {
                    throw new Error('Insufficient items in inventory.');
                }

                itemDataForAttachment = {

                    itemKey: itemKey,
                    category: serverCategory,

                    data: {
                        quantity: quantity
                    }
                };

                item.quantity -= quantity;
                if (item.quantity === 0) {
                    inventory[serverCategory].delete(itemKey);
                }
            }

            await inventory.save({session});

            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            const subject = `${itemDataFromCatalog.name} x${finalQuantity}`;

            const inboxMail = new Mail({
                ownerAddress: recipientAddress, folder: 'inbox', senderAddress, recipientAddress, subject,
                attachments: [itemDataForAttachment],
                hasAttachments: true, expiresAt: expirationDate
            });
            const sentMail = new Mail({
                ownerAddress: senderAddress, folder: 'sent', senderAddress, recipientAddress, subject,
                attachments: [itemDataForAttachment],
                hasAttachments: true, isRead: true, attachmentsClaimed: true, expiresAt: expirationDate
            });

            await inboxMail.save({session});
            await sentMail.save({session});

            const sentMailObject = sentMail.toObject();
            const inboxMailObject = inboxMail.toObject();

            sentMailObject._id = sentMailObject._id.toString();
            inboxMailObject._id = inboxMailObject._id.toString();

            finalResult = {
                success: true,
                message: "Item sent successfully.",
                sentMail: sentMailObject,
                inboxMail: inboxMailObject
            };

        });

        logger.warn(`Item [${itemKey} x${quantity}] sent from ${senderAddress} to ${recipientAddress}`, `mail_${senderAddress}`);
        return finalResult;
    } catch (error) {
        const errorMessage = error.message || 'Unknown transaction error';
        logger.error(`sendItem transaction failed for ${senderAddress}: ${errorMessage}`, `mail_${senderAddress}`);
        return {success: false, error: errorMessage};
    } finally {
        await session.endSession();
    }
}

async function getMails(payload, playerAddress) {
    playerAddress = playerAddress?.toLowerCase();

    const {folder} = payload || {};
    const MAX_MAILS_TO_SHOW = 50;

    try {
        const mailsFromDb = await Mail
            .find({ownerAddress: playerAddress, folder: folder})
            .sort({createdAt: -1})
            .limit(MAX_MAILS_TO_SHOW)
            .lean();

        const mailsForClient = mailsFromDb.map(mail => ({
            ...mail,
            _id: mail._id.toString()
        }));

        return {
            success: true,
            data: {
                folder: folder,
                mails: mailsForClient
            }
        };
    } catch (error) {
        logger.error(`Error fetching mails for ${playerAddress}: ${error.message}`, `mail_${playerAddress}`);
        return {success: false, error: 'Failed to retrieve mail.'};
    }
}

async function claimItemFromMail(payload, playerAddress) {
    playerAddress = playerAddress?.toLowerCase();
    const {mailId} = payload;

    const session = await mongoose.startSession();

    try {
        let finalResult = {};
        await session.withTransaction(async () => {

            const mail = await Mail.findById(mailId).session(session);
            const inventory = await Inventory.findOne({walletAddress: playerAddress}).session(session);

            if (!mail) throw new Error('Mail not found.');
            if (mail.ownerAddress.toLowerCase() !== playerAddress.toLowerCase()) throw new Error('You do not own this mail.');
            if (mail.folder !== 'inbox') throw new Error('Mail is not in the inbox.');
            if (!mail.hasAttachments || mail.attachments.length === 0) throw new Error('Mail has no attachments.');
            if (mail.attachmentsClaimed) throw new Error('Attachments already claimed.');
            if (!inventory) throw new Error('Player inventory not found.');

            const claimedItemsForResponse = [];

            for (const attachment of mail.attachments) {
                const attachmentObject = attachment.toObject();
                claimedItemsForResponse.push(attachmentObject);

                const {itemUid, itemKey, category, data} = attachmentObject;

                if (category === 'hulls') {
                    logCraftAttempt('ITEM_ACQUIRED', {
                        walletAddress: playerAddress,
                        details: {
                            itemKey: itemKey,
                            category: category,
                            quantity: data.quantity,
                            source: "mail",
                            sender: mail.senderAddress
                        }
                    });
                }

                if (category === 'modules') {
                    if (!itemUid || !data) throw new Error('Module attachment is malformed.');
                    if (inventory.modules.has(itemUid)) throw new Error(`Duplicate module UID detected: ${itemUid}`);
                    inventory.modules.set(itemUid, data);

                } else {
                    if (!itemKey || !data?.quantity) throw new Error('Stackable item attachment is malformed.');
                    if (!inventory[category]) throw new Error(`Invalid item category in mail: ${category}.`);
                    const currentQuantity = inventory[category].get(itemKey)?.quantity || 0;
                    inventory[category].set(itemKey, {quantity: currentQuantity + data.quantity});
                }
            }
            logger.warn(`Items ${mail.subject} claimed by ${playerAddress}.`, `mail_${playerAddress}`);

            mail.attachmentsClaimed = true;
            mail.hasAttachments = false;
            mail.isRead = true;

            await inventory.save({session});
            await mail.save({session});

            finalResult = {
                success: true,
                message: 'Items claimed successfully.',
                claimedItems: claimedItemsForResponse
            };

        });

        return finalResult;

    } catch (error) {
        logger.error(`Claim item failed for ${playerAddress}, mailId ${mailId}: ${error.message}`, `mail_${playerAddress}`);
        return {success: false, error: error.message || 'Transaction failed.'};
    } finally {
        await session.endSession();
    }
}

async function deleteMail(payload, playerAddress) {
    playerAddress = playerAddress?.toLowerCase();
    const {mailId} = payload;

    try {

        const mail = await Mail.findById(mailId).lean();

        if (!mail) {

            logger.debug(`Attempted to delete mail ${mailId} which was not found.`, `mail_${playerAddress}`);
            return {success: true};
        }

        if (mail.ownerAddress.toLowerCase() !== playerAddress.toLowerCase()) {

            logger.error(`SECURITY: Player ${playerAddress} attempted to delete mail ${mailId} owned by ${mail.ownerAddress}.`, `mail_${playerAddress}`);
            return {success: false, error: 'Permission denied.'};
        }

        await Mail.deleteOne({_id: mailId});

        logger.debug(`Mail ${mailId} deleted successfully by owner ${playerAddress}.`, `mail_${playerAddress}`);

        return {success: true, message: 'Mail deleted.'};

    } catch (error) {
        logger.error(`Delete mail failed for ${playerAddress}, mailId ${mailId}: ${error.message}`, `mail_${playerAddress}`);
        return {success: false, error: 'Server error during mail deletion.'};
    }
}

module.exports = {
    sendItem,
    getMails,
    claimItemFromMail,
    deleteMail
};