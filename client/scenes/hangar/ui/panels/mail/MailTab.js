import {MailItem} from '../../components/MailItem.js';
import {claimItemsFromMail, deleteMail} from '../../processing/mailHandler.js';
import {FilterableListPanel} from '../../components/FilterableListPanel.js';

const GAP = 20;
const SORTER_WIDTH = 50;
const SCROLLBAR_WIDTH = 10;

/**
 * Создает контент для одной вкладки почты (Inbox или Sent).
 * @param {object} config - Конфигурация.
 * @param {Phaser.Scene} config.scene - Сцена.
 * @param {number} config.totalWidth - Общая доступная ширина.
 * @param {number} config.availableHeight - Доступная высота.
 * @param {string} config.folder - Тип папки ('inbox' или 'sent').
 */
export function createMailTab(config) {
    const {scene, availableHeight, totalWidth, folder} = config;

    const sortButtons = [{id: 'all', label: 'All'}];

    const listComponentWidth = totalWidth - SORTER_WIDTH - GAP;
    const listContentWidth = listComponentWidth - SCROLLBAR_WIDTH - GAP;

    /**
     * Создает один элемент списка для письма.
     */
    const mailItemFactory = (mailData) => {
        const mailListItem = new MailItem({
            scene,
            mailData,
            folder,
            width: listContentWidth
        });

        mailListItem.on('claim-clicked', async (mailId) => {
            try {
                await claimItemsFromMail(scene, mailId);
            } catch (error) {
                console.error(`Failed to claim mail ${mailId}:`, error);
            }
        });

        mailListItem.on('delete-clicked', async (mailId, mailFolder) => {
            try {
                await deleteMail(scene, mailId, mailFolder);
            } catch (error) {
                console.error(`Failed to delete mail ${mailId}:`, error);
            }
        });

        return mailListItem;
    };

    const panel = new FilterableListPanel({
        scene,
        availableHeight,
        totalWidth,
        sortButtons,
        itemFactory: mailItemFactory,
        sorterPosition: 'right',
        scrollbarPosition: 'left'
    });

    const update = (mails) => {
        panel.update(mails, null);
    };

    return {
        container: panel,
        update: update,
    };
}
