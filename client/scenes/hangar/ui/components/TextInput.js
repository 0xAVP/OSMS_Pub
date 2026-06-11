import Phaser from 'phaser';

const DEFAULTS = {
    width: 300,
    height: 40,
    placeholder: 'Enter text...',
    style: {
        fontFamily: 'Tektur',
        fontSize: '16px',
        color: '#ffffff',
        placeholderColor: '#888888',
        backgroundColor: 0x1A1325,
        backgroundAlpha: 0.85,
        cornerRadius: 8,
        padding: 10,
    },
};

const CURSOR_CHAR = '|';
const CURSOR_BLINK_INTERVAL = 500;

/**
 * @class TextInput
 * @extends Phaser.GameObjects.Container
 * @description
 * Переиспользуемый компонент для ввода текста, имитирующий стандартное поле ввода.
 * Управляет собственным состоянием, вводом с клавиатуры и визуализацией.
 */
export class TextInput extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);

        this.config = Phaser.Utils.Objects.MergeRight(Phaser.Utils.Objects.Clone(DEFAULTS), config);

        this.isInputActive = false;
        this.inputBuffer = '';
        this.cursorTimer = null;
        this.globalKeyDownHandler = null;
        this.globalPointerDownHandler = null;

        this._createUI();
        this._attachEventListeners();

        scene.add.existing(this);
    }

    /**
     * @private Создает визуальные элементы компонента.
     */
    _createUI() {
        const {width, height, style, placeholder} = this.config;

        this.background = this.scene.add.graphics();
        this.background.fillStyle(style.backgroundColor, style.backgroundAlpha);
        this.background.fillRoundedRect(-width / 2, -height / 2, width, height, style.cornerRadius);

        const textX = -width / 2 + style.padding;

        const textY = 0;

        this.textObject = this.scene.add.text(textX, textY, placeholder, {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            color: style.placeholderColor,

            fixedWidth: width - style.padding * 2,
            align: 'left',

        }).setOrigin(0, 0.5);

        this.add([this.background, this.textObject]);
        this.setSize(width, height).setInteractive();
    }

    /**
     * @private Привязывает основные слушатели событий.
     */
    _attachEventListeners() {
        this.on('pointerdown', (pointer, localX, localY, event) => {
            this._activateInputMode();
            event.stopPropagation();
        });

        this.on('destroy', this._cleanup, this);
    }

    /**
     * @private Активирует режим ввода текста.
     */
    _activateInputMode() {
        if (this.isInputActive) return;
        this.isInputActive = true;

        if (this.textObject.text === this.config.placeholder) {
            this.inputBuffer = '';
        }

        this.textObject.setColor(this.config.style.color);
        this._startCursorBlink();
        this._addGlobalListeners();
    }

    /**
     * @private Деактивирует режим ввода текста.
     */
    _deactivateInputMode() {
        if (!this.isInputActive) return;
        this.isInputActive = false;

        this._stopCursorBlink();
        this._removeGlobalListeners();

        if (this.inputBuffer.trim() === '') {
            this.textObject.setText(this.config.placeholder).setColor(this.config.style.placeholderColor);
        } else {
            this.textObject.setText(this.inputBuffer);
        }
    }

    /**
     * @private Добавляет глобальные слушатели (клавиатура, клик вне поля).
     */
    _addGlobalListeners() {
        this.globalKeyDownHandler = async (event) => {
            event.stopPropagation();

            if (event.key === 'Escape') {
                this.inputBuffer = '';
                this._deactivateInputMode();

            } else if (event.key === 'Enter') {
                this._deactivateInputMode();
            } else if (event.key === 'Backspace') {
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                this._updateTextWithCursor();

            } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
                event.preventDefault();
                try {
                    const textToPaste = await navigator.clipboard.readText();
                    this.inputBuffer += textToPaste;
                    this._updateTextWithCursor();
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                }

            } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
                this.inputBuffer += event.key;
                this._updateTextWithCursor();
            }
        };

        this.globalPointerDownHandler = (pointer) => {

            if (!this.getBounds().contains(pointer.worldX, pointer.worldY)) {
                this._deactivateInputMode();
            }
        };

        this.scene.input.keyboard.on('keydown', this.globalKeyDownHandler);
        this.scene.input.on('pointerdown', this.globalPointerDownHandler);
    }

    /**
     * @private Удаляет глобальные слушатели.
     */
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

    _startCursorBlink() {
        this._stopCursorBlink();
        this._updateTextWithCursor(true);
        this.cursorTimer = this.scene.time.addEvent({
            delay: CURSOR_BLINK_INTERVAL,
            callback: () => this._updateTextWithCursor(!this.textObject.text.endsWith(CURSOR_CHAR)),
            loop: true
        });
    }

    _stopCursorBlink() {
        if (this.cursorTimer) {
            this.cursorTimer.remove();
            this.cursorTimer = null;
        }
    }

    _updateTextWithCursor(showCursor = true) {
        const text = this.inputBuffer + (showCursor ? CURSOR_CHAR : '');
        this.textObject.setText(text);
    }

    _cleanup() {
        this._removeGlobalListeners();
        this._stopCursorBlink();
    }

    /**
     * Геттер для получения текущего введенного текста.
     * @returns {string}
     */
    get text() {
        return this.inputBuffer;
    }

    /**
     * Сеттер для программной установки текста.
     * @param {string} value - Новое значение текста.
     */
    set text(value) {
        this.inputBuffer = value || '';
        if (this.isInputActive) {
            this._updateTextWithCursor();
        } else {
            if (this.inputBuffer === '') {
                this.textObject.setText(this.config.placeholder).setColor(this.config.style.placeholderColor);
            } else {
                this.textObject.setText(this.inputBuffer).setColor(this.config.style.color);
            }
        }
    }
}
