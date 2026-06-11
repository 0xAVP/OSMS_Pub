import {SHIP_LORE_DATA} from "./shipsData";
import Phaser from 'phaser';

const STYLES = {
    HEADER: {fontFamily: 'Tektur', fontSize: '24px', color: '#41C6FF'},
    SPEC_LABEL: {fontFamily: 'Tektur', fontSize: '20px', color: '#cccccc'},
    SPEC_VALUE: {fontFamily: 'Tektur', fontSize: '20px', color: '#ffffff'},
    BONUS_TEXT: {fontFamily: 'Tektur', fontSize: '18px', color: '#42DA9D', lineSpacing: 8},
};

export class SpecificationsPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        this._createUI();
    }

    _createUI() {
        let currentY = -250;
        const header = this.scene.add.text(0, currentY, 'SPECIFICATIONS', STYLES.HEADER).setOrigin(0.5);
        currentY += header.height + 30;

        const hullLabel = this.scene.add.text(-190, currentY, 'Hull Integrity:', STYLES.SPEC_LABEL).setOrigin(0, 0.5);
        this.hullText = this.scene.add.text(190, currentY, '', STYLES.SPEC_VALUE).setOrigin(1, 0.5);
        currentY += hullLabel.height + 30;

        this.bonusesHeader = this.scene.add.text(-190, currentY, 'Inherent Bonuses:', STYLES.SPEC_LABEL).setOrigin(0, 0);
        currentY += this.bonusesHeader.height + 15;
        this.bonusesContainer = this.scene.add.container(-190, currentY);

        this.add([
            header, hullLabel, this.hullText, this.bonusesHeader, this.bonusesContainer
        ]);
    }

    update(shipData) {
        const lore = SHIP_LORE_DATA[shipData.name] || SHIP_LORE_DATA.default;

        this.hullText.setText(lore.hull.toLocaleString());
        this.bonusesContainer.removeAll(true);

        let bonusY = 0;
        lore.bonuses.forEach(bonus => {
            const bonusText = this.scene.add.text(0, bonusY, `• ${bonus}`, STYLES.BONUS_TEXT);
            this.bonusesContainer.add(bonusText);
            bonusY += bonusText.height + 8;
        });
    }
}