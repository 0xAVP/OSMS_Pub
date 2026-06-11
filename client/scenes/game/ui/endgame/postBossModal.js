import Phaser from 'phaser';
import {BaseHorizontalModal} from './BaseHorizontalModal';
import {CMT} from '../../../core/gameStateKeys';
import {encode} from '@msgpack/msgpack';

export class PostBossModal extends BaseHorizontalModal {
    constructor(scene) {
        super(scene, 280);

        this.accentColor = 0x41C6FF;
        this.keyQ = null;
        this.isRequestSent = false;

        this._createBackground(this.accentColor);
    }

    show(remainingTime) {
        this._createContent(remainingTime);
        super.show();

        this.keyQ = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyQ.on('down', this._sendEndGameRequest, this);
    }

    _createContent(remainingTime) {
        const padding = this.scale(40);
        const contentWidth = this.width - (padding * 2);

        const leftColumnX = -this.width / 2 + padding;

        const stageClearText = this.scene.add.text(leftColumnX, -this.height / 2 + padding, 'STAGE CLEAR', {
            fontFamily: 'Orbitron', fontSize: `${this.scale(28)}px`, color: '#41C6FF'
        }).setOrigin(0, 0);

        this.timerText = this.scene.add.text(leftColumnX, 0, remainingTime.toString(), {
            fontFamily: 'Orbitron', fontSize: `${this.scale(110)}px`, color: '#FFD700',
        }).setOrigin(0, 0.5);

        const nextWaveText = this.scene.add.text(leftColumnX, this.height / 2 - padding, 'Next stage starting in...', {
            fontFamily: 'Tektur', fontSize: `${this.scale(18)}px`, color: '#cccccc'
        }).setOrigin(0, 1);

        const separatorX = -this.scale(100);
        const separator = this.scene.add.graphics();
        separator.fillStyle(this.accentColor, 0.5);
        separator.fillRect(separatorX, -this.height / 2 * 0.7, this.scale(2), this.height * 0.7);

        const rightColumnX = separatorX + padding;
        const rightColumnWidth = this.width / 2 - rightColumnX - padding;

        const keyHintContainer = this._createKeyHint(rightColumnX + rightColumnWidth / 2, -this.scale(60));

        const hintString = "to RETURN to the hangar and [b][color=#FFD700]KEEP your loot[/color][/b] or wait until the start of the new stage";
        const hintText = this.scene.add.rexBBCodeText(keyHintContainer.x, keyHintContainer.y + this.scale(60), hintString, {
            fontFamily: 'Tektur', fontSize: `${this.scale(20)}px`, color: '#cccccc', fontStyle: 'italic',
            align: 'center',
            wrap: {mode: 'word', width: rightColumnWidth}
        }).setOrigin(0.5, 0.5);

        this._createCustomButton(rightColumnX, this.scale(40), rightColumnWidth);

        this.contentContainer.add([stageClearText, this.timerText, nextWaveText, separator, keyHintContainer, hintText]);
    }

    /**
     * @private
     * Создает визуальный элемент для отображения клавиши.
     * @param {number} x - Центральная координата X.
     * @param {number} y - Центральная координата Y.
     * @returns {Phaser.GameObjects.Container}
     */
    _createKeyHint(x, y) {
        const keyContainer = this.scene.add.container(x, y);
        const keySize = this.scale(70);
        const keyCornerRadius = this.scale(8);

        const keyBg = this.scene.add.graphics();
        keyBg.fillStyle(0x1a1a1e, 1);
        keyBg.fillRoundedRect(-keySize / 2, -keySize / 2, keySize, keySize, keyCornerRadius);
        keyBg.lineStyle(this.scale(2), 0x888888, 1);
        keyBg.strokeRoundedRect(-keySize / 2, -keySize / 2, keySize, keySize, keyCornerRadius);

        const keyText = this.scene.add.text(0, 0, 'Q', {
            fontFamily: 'Orbitron',
            fontSize: `${this.scale(48)}px`,
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        keyContainer.add([keyBg, keyText]);

        this.scene.tweens.add({
            targets: keyContainer,
            scale: 1.05,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        return keyContainer;
    }

    updateTime(newTime) {
        if (this.timerText && this.timerText.active) {
            this.timerText.setText(Math.max(0, newTime).toString());
        }
    }

    _createCustomButton(x, y, width) {
        const button = this.scene.add.container(x, y);
        const buttonHeight = this.scale(60);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0xffffff, 0.1);
        bg.fillRoundedRect(0, 0, width, buttonHeight, this.scale(5));
        bg.lineStyle(this.scale(2), 0xffffff, 0.5);
        bg.strokeRoundedRect(0, 0, width, buttonHeight, this.scale(5));

        const label = this.scene.add.text(width / 2, buttonHeight / 2, 'RETURN & KEEP LOOT', {
            fontFamily: 'Tektur', fontSize: `${this.scale(18)}px`, color: '#ffffff', fontStyle: '600'
        }).setOrigin(0.5);

        button.add([bg, label]);
        const hitArea = new Phaser.Geom.Rectangle(0, 0, width, buttonHeight);

        button.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        this.button = button;
        this.buttonLabel = label;
        this.buttonBg = bg;

        button.on('pointerdown', this._sendEndGameRequest, this);
        button.on('pointerover', () => this.buttonBg.fillGradientStyle(0x41C6FF, 0x41C6FF, 0x00A2FF, 0x00A2FF, 0.3));
        button.on('pointerout', () => this.buttonBg.fillStyle(0xffffff, 0.1));

        this.contentContainer.add(button);
    }

    _sendEndGameRequest() {
        if (this.isRequestSent) return;
        this.isRequestSent = true;

        this.button.disableInteractive();
        this.buttonLabel.setText('Disconnecting...');
        this.buttonLabel.setFontSize(`${this.scale(18)}px`);
        this.button.off('pointerover').off('pointerout');

        if (this.scene.ws && this.scene.ws.readyState === WebSocket.OPEN) {
            this.scene.ws.send(encode([CMT.END_GAME_REQUEST]));
            console.log('[PostBossModal] Sent end-game-request.');
        } else {
            console.warn('[PostBossModal] WebSocket not open. Returning to hangar directly.');
            this.scene.returnToHangar();
        }
    }

    dismiss() {
        if (this.keyQ) {
            this.keyQ.off('down', this._sendEndGameRequest, this);
            this.keyQ.destroy();
            this.keyQ = null;
        }
        super.dismiss();
    }
}
