import Phaser from 'phaser';
import {BaseVerticalModal} from './BaseVerticalModal';

export class DefeatModal extends BaseVerticalModal {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        super(scene, 600);
        this.accentColor = 0xE663CB;
        this._createBackground(this.accentColor);
        this._createReturnButton();
    }

    show(reason, stats) {
        this._createContent(reason, stats);
        super.show();
    }

    _createContent(reason, stats) {
        let currentY = -this.height / 2 + this.scale(80);

        const title = this.scene.add.text(0, currentY, 'DEFEAT', {
            fontFamily: 'Orbitron',
            fontSize: `${this.scale(80)}px`,
            color: '#E663CB',
            align: 'center',
            stroke: '#000000',
            strokeThickness: this.scale(5)
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(title);

        currentY += title.height / 2 + this.scale(100);

        let reasonText = 'Unknown reason';
        if (reason === 'playerLoose') reasonText = 'Your ship has been destroyed.';
        if (reason === 'baseBroken') reasonText = 'The hangar gate has been breached.';
        if (reason === 'serverError') reasonText = 'A server error has occurred.';
        if (reason === 'playerForfeit') reasonText = 'You have forfeited the mission.';

        const reasonLabel = this.scene.add.text(0, currentY, reasonText, {
            fontFamily: 'Tektur',
            fontSize: `${this.scale(26)}px`,
            color: '#ffffff',
            align: 'center',
            wordWrap: {width: this.width * 0.85}
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(reasonLabel);

        currentY += reasonLabel.height / 2 + this.scale(60);

        const encouragementPhrases = [
            "Every defeat is a lesson learned. Try again!",
            "The cosmos is vast. Your journey is not over.",
            "Even the best pilots face setbacks. Onward!",
            "Failure is just a stepping stone to victory.",
            "Re-arm and get back in the fight, pilot!"
        ];
        const randomPhrase = Phaser.Utils.Array.GetRandom(encouragementPhrases);
        const encouragementLabel = this.scene.add.text(0, currentY, randomPhrase, {
            fontFamily: 'Tektur',
            fontSize: `${this.scale(20)}px`,
            color: '#aaaaaa',
            align: 'center',
            fontStyle: 'italic',
            wordWrap: {width: this.width * 0.9}
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(encouragementLabel);

        currentY += encouragementLabel.height / 2 + this.scale(60);

        const killCount = stats?.killCount ?? 0;
        let ratingInfoMessage;
        let ratingInfoColor;

        if (killCount >= 10) {
            ratingInfoMessage = 'Your score has been recorded for the leaderboard.';
            ratingInfoColor = '#42DA9D';
        } else {
            ratingInfoMessage = 'Your score was not recorded. You must defeat at least 10 enemies.';
            ratingInfoColor = '#aaaaaa';
        }

        const ratingInfoText = this.scene.add.text(0, currentY, ratingInfoMessage, {
            fontFamily: 'Tektur',
            fontSize: `${this.scale(20)}px`,
            color: ratingInfoColor,
            align: 'center',
            fontStyle: 'italic',
            wordWrap: {width: this.width * 0.9}
        }).setOrigin(0.5, 0.5);

        this.contentContainer.add(ratingInfoText);

    }
}
