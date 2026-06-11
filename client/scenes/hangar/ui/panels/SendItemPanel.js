import {BaseModal} from '../components/BaseModal.js';
import {SendItemForm} from './forms/SendItemForm.js';
import {sendItem} from '../processing/mailHandler.js';

export class SendItemPanel extends BaseModal {
    /**
     * @param {Phaser.Scene} scene - Сцена Phaser.
     * @param {object} itemData - Данные предмета для отправки.
     */
    constructor(scene, itemData) {

        const form = new SendItemForm(scene, itemData);

        super(scene, form);

        this.currentItem = itemData;
        this.form = form;

        this.form.on('cancel', () => this.hide());
        this.form.on('confirm', (formData) => this._handleSend(formData));

        this.show();
    }

    _handleSend(formData) {
        const {recipientAddress, quantity} = formData;

        const sendPromise = sendItem(this.scene, this.currentItem, quantity, recipientAddress)
            .then(() => {

                if (this.scene && this.active) {
                    this.hide();
                }
            })
            .catch(error => {

                console.error("SendItemPanel: Failed to send item:", error);
            });

        this.form.confirmButton.trackPromise(sendPromise);

        this.form.cancelButton.disable();

        sendPromise.finally(() => {
            if (this.form && this.form.cancelButton && this.form.cancelButton.active) {
                this.form.cancelButton.enable();
            }
        });
    }
}