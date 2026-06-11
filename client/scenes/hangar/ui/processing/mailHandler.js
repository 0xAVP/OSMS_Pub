import {updateInventoryCacheWithItems} from '../../wallet/inventory.js';

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Обрабатывает отправку предмета другому игроку через ActionService.
 */
export async function sendItem(scene, item, quantity, recipientAddress) {

    if (!isValidEthereumAddress(recipientAddress)) {
        const errorMsg = 'Invalid recipient address';
        scene.sysMessageContainer.addMessage(errorMsg, 'WARNING');
        throw new Error(errorMsg);
    }
    if (scene.walletAddress && recipientAddress.toLowerCase() === scene.walletAddress.toLowerCase()) {
        const errorMsg = 'You cannot send items to yourself.';
        scene.sysMessageContainer.addMessage(errorMsg, 'WARNING');
        throw new Error(errorMsg);
    }
    if (!item || !item.key) {
        const errorMsg = 'Invalid item data';
        scene.sysMessageContainer.addMessage(errorMsg, 'ERROR');
        throw new Error(errorMsg);
    }
    const maxQuantity = item?.quantity || 1;
    if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
        const errorMsg = 'Invalid quantity specified';
        scene.sysMessageContainer.addMessage(errorMsg, 'WARNING');
        throw new Error(errorMsg);
    }

    const payload = {
        itemKey: item.key,
        itemUid: item.uid || null,
        quantity: quantity,
        recipientAddress: recipientAddress
    };

    return scene.actionService.execute({
        actionName: 'mail-send-item',
        payload: payload,
        requireFreshSession: true,
        refreshInventoryOnSuccess: true,
        messages: {
            start: `Sending [color=#e0e0e0]${item.name} x${quantity}[/color]...`,
            success: `Successfully sent [color=#C4C6C8]${item.name} x${quantity}[/color]`
        },
        onSuccess: (response) => {

            if (scene.mailData && response.sentMail) {
                if (!scene.mailData.sent) scene.mailData.sent = [];

                scene.mailData.sent.unshift(response.sentMail);
                if (scene.mailData.sent.length > 50) scene.mailData.sent.pop();
                scene.events.emit('mail-list-changed');
            }
        }
    });
}

/**
 * Отправляет запрос на получение предметов из письма через ActionService.
 */
export async function claimItemsFromMail(scene, mailId) {
    if (!mailId) {
        const errorMsg = 'claimItemsFromMail: mailId is missing.';
        scene.sysMessageContainer.addMessage(errorMsg, 'ERROR');
        throw new Error(errorMsg);
    }

    const payload = {mailId};

    return scene.actionService.execute({
        actionName: 'mail-claim-item',
        payload: payload,
        refreshInventoryOnSuccess: false,
        messages: {
            start: 'Claiming item from mail...',
            success: 'Items successfully claimed!'
        },
        onSuccess: (response) => {

            if (scene.mailData?.inbox) {
                const mailInCache = scene.mailData.inbox.find(m => m._id === mailId);
                if (mailInCache) {
                    mailInCache.attachmentsClaimed = true;
                    mailInCache.hasAttachments = false;
                    mailInCache.isRead = true;
                }
                scene.events.emit('mail-list-changed');
            }
            if (response.claimedItems) {

                updateInventoryCacheWithItems.call(scene, response.claimedItems);
            }
        }
    });
}

/**
 * Отправляет запрос на удаление письма через ActionService.
 */
export async function deleteMail(scene, mailId, folder) {
    if (!mailId || !folder) {
        const errorMsg = 'deleteMail: mailId or folder is missing.';
        scene.sysMessageContainer.addMessage(errorMsg, 'ERROR');
        throw new Error(errorMsg);
    }

    const payload = {mailId};

    return scene.actionService.execute({
        actionName: 'mail-delete',
        payload: payload,
        refreshInventoryOnSuccess: false,
        messages: {
            start: 'Deleting mail...',
            success: 'Mail deleted.'
        },
        onSuccess: () => {

            if (scene.mailData?.[folder]) {
                const mailIndex = scene.mailData[folder].findIndex(m => m._id === mailId);
                if (mailIndex > -1) {
                    scene.mailData[folder].splice(mailIndex, 1);
                }
                scene.events.emit('mail-list-changed');
            }
        }
    });
}