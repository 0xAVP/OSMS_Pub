import Phaser from 'phaser';

const DEFAULTS = {
    x: 0,
    y: 0,
    buttonWidth: 50,
    buttonHeight: 50,
    gap: 10,
    iconPrefix: 'sort_',
    bgPadding: 10,
    bgCornerRadius: 8,
    bgInactiveColor: 0x555555,
    bgInactiveAlpha: 0.7,
    bgActiveColor: 0x41C6FF,
    bgActiveAlpha: 0.3,
};

export class SortController extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        const finalConfig = {...DEFAULTS, ...config};
        super(scene, finalConfig.x, finalConfig.y);

        this.config = finalConfig;
        this.buttons = [];
        this.activeButtonId = null;

        this._createButtons();
        scene.add.existing(this);
    }

    _createButtons() {
        const {buttons, buttonWidth, buttonHeight, gap, iconPrefix, bgPadding} = this.config;
        if (!buttons || buttons.length === 0) return;

        let currentY = 0;
        buttons.forEach(buttonConfig => {

            const activeTexture = buttonConfig.activeTexture || `${iconPrefix}${buttonConfig.id}_active`;
            const inactiveTexture = buttonConfig.inactiveTexture || `${iconPrefix}${buttonConfig.id}_no_active`;

            const btnContainer = this.scene.add.container(0, currentY);
            const bg = this.scene.add.graphics();
            const iconSize = Math.min(buttonWidth, buttonHeight) - (bgPadding * 2);
            const btnImage = this.scene.add.image(0, 0, inactiveTexture)
                .setDisplaySize(iconSize, iconSize);

            btnContainer.add([bg, btnImage]);
            const hitArea = new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight);
            btnContainer.setInteractive({
                hitArea,
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true
            });

            btnContainer.on('pointerdown', () => this.setActiveButton(buttonConfig.id));
            btnContainer.on('pointerover', () => {
                if (this.activeButtonId !== buttonConfig.id) {
                    bg.setAlpha(this.config.bgInactiveAlpha * 2);
                }
            });
            btnContainer.on('pointerout', () => {
                if (this.activeButtonId !== buttonConfig.id) {
                    bg.setAlpha(this.config.bgInactiveAlpha);
                }
            });

            this.buttons.push({
                id: buttonConfig.id,
                container: btnContainer,
                bg: bg,
                image: btnImage,
                activeTexture: activeTexture,
                inactiveTexture: inactiveTexture
            });

            this.add(btnContainer);
            currentY += buttonHeight + gap;
        });

        if (buttons.length > 0) {
            this.setActiveButton(buttons[0].id);
        }
    }

    setActiveButton(id) {
        if (this.activeButtonId === id) return;
        this.activeButtonId = id;

        const {
            buttonWidth,
            buttonHeight,
            bgCornerRadius,
            bgInactiveColor,
            bgInactiveAlpha,
            bgActiveColor,
            bgActiveAlpha
        } = this.config;

        this.buttons.forEach(btn => {
            const isActive = btn.id === id;
            btn.image.setTexture(isActive ? btn.activeTexture : btn.inactiveTexture);
            btn.bg.clear();
            btn.bg.fillStyle(
                isActive ? bgActiveColor : bgInactiveColor,
                isActive ? bgActiveAlpha : bgInactiveAlpha
            );
            btn.bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, bgCornerRadius);
            btn.bg.setAlpha(isActive ? bgActiveAlpha : bgInactiveAlpha);
        });

        this.emit('sort-selected', id);
    }
}
