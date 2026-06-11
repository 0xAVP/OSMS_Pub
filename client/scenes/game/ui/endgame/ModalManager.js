import {VictoryModal} from './victoryModal';
import {DefeatModal} from './defeatModal';
import {PostBossModal} from './postBossModal';

import {dimBackground, undimBackground} from '../background/background';

export class ModalManager {
    constructor(scene) {
        this.scene = scene;
        this.activeModal = null;
    }

    dismissActiveModal() {
        if (this.activeModal) {
            this.activeModal.dismiss();
            this.activeModal = null;

            undimBackground(this.scene);
        }
    }

    showVictoryModal(lootData) {
        this.dismissActiveModal();

        dimBackground(this.scene);
        this.activeModal = new VictoryModal(this.scene);
        this.activeModal.show(lootData);
    }

    showDefeatModal(reason, stats) {
        this.dismissActiveModal();
        dimBackground(this.scene);
        this.activeModal = new DefeatModal(this.scene);
        this.activeModal.show(reason, stats);
    }

    /**
     * Показывает или обновляет модальное окно после победы над боссом.
     * @param {number} remainingTime - Время до следующей волны.
     */
    showPostBossModal(remainingTime) {
        if (this.activeModal instanceof PostBossModal) {
            this.activeModal.updateTime(remainingTime);
        } else {
            this.dismissActiveModal();

            dimBackground(this.scene);
            this.activeModal = new PostBossModal(this.scene);
            this.activeModal.show(remainingTime);
        }
    }
}