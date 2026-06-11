import Phaser from 'phaser';
import {DEFAULTS} from './constants.js';
import {createUI} from './ui.js';
import {handleKeyDown} from './keyboardHandler.js';

const CURSOR_CHAR = '|';
const CURSOR_BLINK_INTERVAL = 500;

export class QuantityInput extends Phaser.GameObjects.Container {

    constructor(scene, x, y, config = {}) {
        super(scene, x, y);

        const mergedConfig = {...DEFAULTS, ...config};
        mergedConfig.style = {...DEFAULTS.style, ...config.style};
        this.config = mergedConfig;

        this.currentValue = this.config.initialValue;
        this.dynamicMaxValue = this.config.maxValue;
        this.isInputActive = false;
        this.inputBuffer = '';
        this.valueBeforeEdit = 1;

        this.cursorTimer = null;
        this.globalKeyDownHandler = null;
        this.globalPointerDownHandler = null;

        this.ui = createUI(this.scene, this.config);
        this.add(Object.values(this.ui));
        this.list.forEach(item => item.setDepth(this.depth || 505));

        this._attachEventListeners();

        this.scene.add.existing(this);
        this.setValue(this.currentValue, true);
    }

    _attachEventListeners() {
        const {width, height, buttonSize, maxButtonWidth, gap, showMaxButton} = this.config;

        this.ui.inputBg
            .setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', (pointer, localX, localY, event) => {
                this._activateInputMode();
                event.stopPropagation();
            });

        const minusButtonX = -width / 2 - gap - buttonSize;
        this.ui.minusButton
            .setInteractive(new Phaser.Geom.Rectangle(minusButtonX, -buttonSize / 2, buttonSize, buttonSize), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', (p, lx, ly, e) => {
                this._deactivateInputMode();
                this._decrement();
                e.stopPropagation();
            })
            .on('pointerover', () => this.ui.minusButton.setAlpha(0.8))
            .on('pointerout', () => this.ui.minusButton.setAlpha(1));

        const plusButtonX = width / 2 + gap;
        this.ui.plusButton
            .setInteractive(new Phaser.Geom.Rectangle(plusButtonX, -buttonSize / 2, buttonSize, buttonSize), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', (p, lx, ly, e) => {
                this._deactivateInputMode();
                this._increment();
                e.stopPropagation();
            })
            .on('pointerover', () => this.ui.plusButton.setAlpha(0.8))
            .on('pointerout', () => this.ui.plusButton.setAlpha(1));

        if (showMaxButton && this.ui.maxButtonBg) {
            const maxButtonX = plusButtonX + buttonSize + gap;
            this.ui.maxButtonBg
                .setInteractive(new Phaser.Geom.Rectangle(maxButtonX, -buttonSize / 2, maxButtonWidth, buttonSize), Phaser.Geom.Rectangle.Contains)
                .on('pointerdown', (p, lx, ly, e) => {
                    this._deactivateInputMode();
                    this.setValue(this._getEffectiveMax());
                    e.stopPropagation();
                })
                .on('pointerover', () => this.ui.maxButtonBg.setAlpha(0.8))
                .on('pointerout', () => this.ui.maxButtonBg.setAlpha(1));
        }
    }

    _activateInputMode() {
        if (this.isInputActive) return;
        this.isInputActive = true;
        this.valueBeforeEdit = this.currentValue;

        this.inputBuffer = '';
        this._updateValueFromBuffer();

        this._startCursorBlink();
        this._addGlobalListeners();
    }

    _deactivateInputMode(revert = false) {
        if (!this.isInputActive) return;
        this.isInputActive = false;

        this._stopCursorBlink();
        this._removeGlobalListeners();

        if (revert) {
            this.setValue(this.valueBeforeEdit);
        } else {
            this.setValue(this.inputBuffer || this.config.minValue);
        }
    }

    _addGlobalListeners() {
        this.globalKeyDownHandler = (event) => {
            const result = handleKeyDown(event, {
                inputBuffer: this.inputBuffer,
                effectiveMax: this._getEffectiveMax()
            });

            if (result.action === 'input') {
                this.inputBuffer = result.buffer;
                this._updateValueFromBuffer();
            } else if (result.action === 'confirm') {
                this._deactivateInputMode(false);
            } else if (result.action === 'cancel') {
                this._deactivateInputMode(true);
            }
        };

        this.globalPointerDownHandler = (pointer) => {
            if (!this.getBounds().contains(pointer.worldX, pointer.worldY)) {
                this._deactivateInputMode(false);
            }
        };

        this.scene.input.keyboard.on('keydown', this.globalKeyDownHandler);
        this.scene.input.on('pointerdown', this.globalPointerDownHandler);
    }

    _removeGlobalListeners() {
        if (this.globalKeyDownHandler) {
            this.scene.input.keyboard.off('keydown', this.globalKeyDownHandler);
            this.globalKeyDownHandler = null;
        }
        if (this.globalPointerDownHandler) {
            this.scene.input.off('pointerdown', this.globalPointerDownHandler);
            this.globalPointerDownHandler = null;
        }
    }

    _updateValueFromBuffer() {
        const newValue = parseInt(this.inputBuffer, 10);

        let finalValue;
        if (isNaN(newValue) || this.inputBuffer === '') {
            finalValue = this.config.minValue;
        } else {
            finalValue = Phaser.Math.Clamp(
                newValue,
                this.config.minValue,
                this._getEffectiveMax()
            );
        }

        this.currentValue = finalValue;
        this.emit('change', this.currentValue);
        this._updateInputTextWithCursor();
    }

    _startCursorBlink() {
        this._stopCursorBlink();
        this.cursorTimer = this.scene.time.addEvent({
            delay: CURSOR_BLINK_INTERVAL,
            callback: this._toggleCursor,
            callbackScope: this,
            loop: true
        });
        this._updateInputTextWithCursor(true);
    }

    _stopCursorBlink() {
        if (this.cursorTimer) {
            this.cursorTimer.remove();
            this.cursorTimer = null;
        }
    }

    _toggleCursor() {
        const isVisible = this.ui.inputText.text.endsWith(CURSOR_CHAR);
        this._updateInputTextWithCursor(!isVisible);
    }

    _updateInputTextWithCursor(showCursor = true) {
        const text = this.inputBuffer + (this.isInputActive && showCursor ? CURSOR_CHAR : '');
        this.ui.inputText.setText(text);
    }

    _increment() {
        this.setValue(this.getValue() + 1);
    }

    _decrement() {
        this.setValue(this.getValue() - 1);
    }

    _getEffectiveMax() {
        return Math.min(this.config.maxValue, this.dynamicMaxValue);
    }

    setValue(newValue, silent = false) {
        if (this.isInputActive) {
            this._deactivateInputMode(false);
        }

        const value = Phaser.Math.Clamp(
            Math.floor(Number(newValue) || this.config.minValue),
            this.config.minValue,
            this._getEffectiveMax()
        );

        this.currentValue = value;
        if (this.ui.inputText) {
            this.ui.inputText.setText(this.currentValue.toString());
        }

        if (!silent) {
            this.emit('change', this.currentValue);
        }
    }

    getValue() {
        return this.currentValue;
    }

    setDynamicMax(newMax) {
        this.dynamicMaxValue = Math.max(this.config.minValue, newMax);
        if (this.currentValue > this._getEffectiveMax()) {
            this.setValue(this._getEffectiveMax());
        }
    }

    destroy(fromScene) {
        this._stopCursorBlink();
        this._removeGlobalListeners();
        super.destroy(fromScene);
    }
}
