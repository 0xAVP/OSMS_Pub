import {webSocketManager} from '../WebSocketManager.js';

/**
 * Запрашивает и обновляет данные почты (inbox и sent).
 * Может быть вызвана для принудительного обновления.
 * 'this' здесь - это контекст сцены.
 */
export async function refreshMails() {
    try {
        console.log('Refreshing mail data...');

        const inboxPromise = webSocketManager.sendMessage('mails-get-list', {folder: 'inbox'});
        const sentPromise = webSocketManager.sendMessage('mails-get-list', {folder: 'sent'});

        const [inboxResponse, sentResponse] = await Promise.all([inboxPromise, sentPromise]);

        if (inboxResponse && sentResponse) {

            this.mailData = {
                inbox: inboxResponse.data.mails,
                sent: sentResponse.data.mails
            };

            this.events.emit('mail-list-changed');
            console.log('Mail data refreshed successfully.');
            return this.mailData;
        } else {
            throw new Error('Failed to refresh one or both mail folders');
        }
    } catch (error) {
        console.error('refreshMails failed:', error);

        throw error;
    }
}