import Phaser from 'phaser';
import {BASE_WIDTH, CONFIG, BASE_STYLES} from './constants.js';
import {formatCountdown, formatData} from './formatters.js';

export class Tooltip extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);

        this.setDepth(510).setVisible(false);

        this.isLocked = false;
        this.countdownInterval = null;

        this.background = scene.add.graphics();
        this.contentContainer = scene.add.container(0, 0);
        this.add([this.background, this.contentContainer]);

        scene.add.existing(this);
    }

    /**
     * Показывает и обновляет тултип. Не уничтожает себя.
     */
    show(x, y, data) {
        if (this.isLocked) return;

        const wasVisible = this.visible && this.alpha > 0;

        this.scene.tweens.killTweensOf(this);

        this._buildContent(data);
        this._updatePosition({x, y});

        if (!this.scene.input.listeners('pointermove').some(listener => listener.callback === this._updatePosition)) {
            this.scene.input.on('pointermove', this._updatePosition, this);
        }

        if (!wasVisible) {
            this.setScale(0.95).setAlpha(0).setVisible(true);
            this.scene.tweens.add({targets: this, scale: 1, alpha: 1, duration: 200, ease: 'Sine.easeOut'});
        } else {

            this.setAlpha(1);
        }

    }

    /**
     * Скрывает тултип с анимацией. Не уничтожает себя.
     */
    hide() {

        if (this.isLocked) return;

        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = null;

        this.scene.input.off('pointermove', this._updatePosition, this);

        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.95,
            duration: 150,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.setVisible(false);
                this.unlock();
            }
        });
    }

    lock() {
        this.isLocked = true;
    }

    unlock() {
        this.isLocked = false;
    }

    /**
     * Вызывается Phaser при уничтожении сцены.
     */
    destroy(fromScene) {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.scene.input.off('pointermove', this._updatePosition, this);
        super.destroy(fromScene);
    }

    _buildContent(data) {

        this.contentContainer.removeAll(true);
        const scaleFactor = this.scene.scale.width / BASE_WIDTH;
        const currentStyles = this._getCurrentStyles(scaleFactor);
        const linesData = formatData(data, currentStyles);
        if (linesData.length === 0) return;
        const currentPaddingX = Math.max(8, CONFIG.BASE_PADDING_X * scaleFactor);
        const currentPaddingY = Math.max(5, CONFIG.BASE_PADDING_Y * scaleFactor);
        const currentLineSpacing = Math.max(4, CONFIG.BASE_LINE_SPACING * scaleFactor);
        let totalHeight = currentPaddingY;
        let maxWidth = 0;
        linesData.forEach(line => {
            const textEl = this.scene.add.text(currentPaddingX, totalHeight, line.text, {
                ...line.style,
                wordWrap: {width: CONFIG.MAX_TEXT_WIDTH}
            }).setOrigin(0);
            if (line.key === 'countdown') this._startCountdown(textEl, data.countdown);
            this.contentContainer.add(textEl);
            totalHeight += textEl.height + currentLineSpacing;
            if (textEl.width > maxWidth) maxWidth = textEl.width;
        });
        totalHeight = (totalHeight - currentLineSpacing) + currentPaddingY;
        const tooltipWidth = maxWidth + currentPaddingX * 2;
        this.background.clear().fillStyle(CONFIG.BG_COLOR, CONFIG.BG_ALPHA).fillRoundedRect(0, 0, tooltipWidth, totalHeight, CONFIG.CORNER_RADIUS);
        this.setSize(tooltipWidth, totalHeight);
    }

    _updatePosition(pointer) {

        if (this.isLocked) return;
        let newX = pointer.x + CONFIG.OFFSET_X;
        let newY = pointer.y + CONFIG.OFFSET_Y;
        if (newX + this.width > this.scene.scale.width) newX = pointer.x - this.width - CONFIG.OFFSET_X;
        if (newY + this.height > this.scene.scale.height) newY = pointer.y - this.height - CONFIG.OFFSET_Y;
        this.setPosition(newX, newY);
    }

    _getCurrentStyles(scaleFactor) {

        const styles = {};
        for (const key in BASE_STYLES) {
            if (typeof BASE_STYLES[key] === 'function') continue;
            const baseStyle = BASE_STYLES[key];
            styles[key] = {...baseStyle, fontSize: `${Math.max(12, Math.round(baseStyle.fontSize * scaleFactor))}px`};
        }
        return styles;
    }

    _startCountdown(textElement, expiresAtTimestamp) {

        const timeDelta = this.scene.registry.get('time_delta') || 0;
        const expiresAt = new Date(expiresAtTimestamp).getTime();
        const update = () => {
            if (!textElement || !textElement.scene) {
                if (this.countdownInterval) clearInterval(this.countdownInterval);
                return;
            }
            const correctedNow = Date.now() + timeDelta;
            const remainingSeconds = (expiresAt - correctedNow) / 1000;
            textElement.setText(`Time left: ${formatCountdown(remainingSeconds)}`);
        };
        update();
        this.countdownInterval = setInterval(update, 1000);
    }
}