import Phaser from 'phaser';
import {ModuleSlot} from './ModuleSlot.js';
import {getModuleByType, getSlotDisplayName} from '../panels/station/stationUtils.js';
import {ArcGlowEffect} from './ArcGlowEffect.js';

const ELLIPSE_SLOT_POSITIONS = {
    extra1: 0.0,
    engine: 0.5,
    shield: 0.60,
    armor: 0.40,
    weapon1: 0.90,
    weapon2: 0.10,
};

const EXTRA2_OFFSET_X = 160;

export class ShipModuleDisplay extends Phaser.GameObjects.Container {
    constructor(scene, shipSprite) {
        super(scene, 0, 0);
        this.shipSprite = shipSprite;
        this.moduleSlots = {};
        this.arcGlowEffect = new ArcGlowEffect(scene);
        this.add(this.arcGlowEffect);
        this._createSlots();
        scene.add.existing(this);
    }

    _createSlots() {
        const allSlotKeys = ['shield', 'armor', 'engine', 'weapon1', 'weapon2', 'extra1', 'extra2'];
        allSlotKeys.forEach(slotKey => {
            const moduleSlot = new ModuleSlot(this.scene, 0, 0, slotKey);
            this.moduleSlots[slotKey] = moduleSlot;
            this.add(moduleSlot);

            moduleSlot.on('slot-clicked', (clickedSlotKey) => {

                this.emit('module-slot-clicked', clickedSlotKey);
            });

        });
    }

    update(shipData, dimensions = {}) {
        if (!shipData || !this.shipSprite.visible) {
            this.setVisible(false);
            this.arcGlowEffect.hide();
            return;
        }

        this.setVisible(true);
        this._updateSlotContent(shipData, dimensions);
        const ellipse = this._updateLayout(dimensions);

        this.arcGlowEffect.draw(ellipse, {
            leftStart: ELLIPSE_SLOT_POSITIONS.armor,
            leftEnd: ELLIPSE_SLOT_POSITIONS.shield,
            rightStart: ELLIPSE_SLOT_POSITIONS.weapon1,
            rightEnd: ELLIPSE_SLOT_POSITIONS.weapon2,
        });
    }

    _updateSlotContent(shipData, dimensions) {
        const moduleSize = dimensions.moduleSize || 100;
        const scaleFactor = dimensions.scaleFactor || 1;

        for (const slotKey in this.moduleSlots) {
            const moduleSlot = this.moduleSlots[slotKey];
            const moduleData = getModuleByType(this.scene, slotKey);
            moduleSlot.update(moduleData, moduleSize, scaleFactor);
        }
    }

    _updateLayout(dimensions) {
        const ellipseWidth = dimensions.ellipseWidth || 950;
        const ellipseHeight = dimensions.ellipseHeight || 450;
        const ellipse = new Phaser.Geom.Ellipse(0, 0, ellipseWidth, ellipseHeight);

        for (const slotKey in ELLIPSE_SLOT_POSITIONS) {
            const moduleSlot = this.moduleSlots[slotKey];
            const positionOnEllipse = ELLIPSE_SLOT_POSITIONS[slotKey];
            const slotPoint = ellipse.getPoint(positionOnEllipse);
            moduleSlot.setPosition(slotPoint.x, slotPoint.y);
        }

        const extra1Slot = this.moduleSlots['extra1'];
        const extra2Slot = this.moduleSlots['extra2'];
        const currentOffsetX = EXTRA2_OFFSET_X * (ellipseWidth / 950);
        extra2Slot.setPosition(extra1Slot.x + currentOffsetX, extra1Slot.y);

        return ellipse;
    }
}