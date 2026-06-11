import Phaser from 'phaser';

const STYLES = {
    font: {fontFamily: 'Tektur', fontSize: '14px', color: '#41C6FF'},
    hoverColor: '#82d4ff',
};

export class ParamToggle extends Phaser.GameObjects.Text {
    constructor(scene, x, y, currentMode = 'current') {

        const buttonText = currentMode === 'current' ? '[ Show Basic Stats ]' : '[ Show Current Stats ]';
        super(scene, x, y, buttonText, STYLES.font);

        this.setOrigin(0.5, 0.5)
            .setInteractive({useHandCursor: true});

        this.on('pointerdown', () => {
            const newMode = currentMode === 'current' ? 'basic' : 'current';
            this.emit('toggle', newMode);
        });

        this.on('pointerover', () => this.setColor(STYLES.hoverColor));
        this.on('pointerout', () => this.setColor(STYLES.font.color));
    }
}