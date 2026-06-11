import Phaser from 'phaser';

const STYLES = {
    label: {fontFamily: 'Tektur', fontSize: '16px', color: '#cccccc'},
    disabledText: {fontFamily: 'Tektur', fontSize: '16px', color: '#666666', fontStyle: 'italic'},
};

export class DepositView extends Phaser.GameObjects.Container {
    constructor(scene, width, height) {
        super(scene, 0, 0);
        this.panelWidth = width;
        this.panelHeight = height;

        this._createUI();
    }

    _createUI() {

        const centerY = this.panelHeight / 2;
        const centerX = this.panelWidth / 2;

        const icon = this.scene.add.image(centerX, centerY - 40, 'ic_account')
            .setScale(1.5)
            .setAlpha(0.5)
            .setTint(0x666666);

        const infoText = this.scene.add.text(centerX, centerY + 30, 'Deposits are currently disabled.', STYLES.disabledText)
            .setOrigin(0.5);

        const subText = this.scene.add.text(centerX, centerY + 60, 'Bridge integration coming soon.', {
            ...STYLES.label,
            fontSize: '14px',
            color: '#444'
        })
            .setOrigin(0.5);

        this.add([icon, infoText, subText]);
    }
}
