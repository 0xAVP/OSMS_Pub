import Phaser from 'phaser';
import {preloadHangar} from './shared/preload/preloadHangar.js';
import {preloadGame} from './shared/preload/preloadGame.js';
import {soundManager} from './shared/SoundManager.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
        this.startData = {};
        this.progressBar = null;
        this.progressText = null;
        this.statusText = null;
    }

    init(data) {
        this.startData = data;
        soundManager.init(this);
    }

    preload() {
        this.load.image('loading_logo', '/assets/images/loading_logo.png');
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        this.load.json('pilotsMetadata', '/assets/nfts/echoes/echoesData.json');
        soundManager.preloadSounds();
    }

    create() {
        const {width, height} = this.sys.game.config;
        this.cameras.main.setBackgroundColor('#050011');

        const logo = this.add.image(width / 2, height / 2 - 100, 'loading_logo').setOrigin(0.5).setScale(0.8);
        this.tweens.add({
            targets: logo,
            scale: 0.85,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        const loadingLabel = this.add.text(width / 2, height / 2 + 20, 'LOADING', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.progressText = this.add.text(width / 2, height / 2 + 55, '0%', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.statusText = this.add.text(width / 2, height / 2 + 85, 'Initializing...', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#cccccc'
        }).setOrigin(0.5);

        const progressBarBg = this.add.graphics();
        progressBarBg.fillStyle(0x333333, 1);
        progressBarBg.fillRoundedRect(width / 2 - 150, height / 2 + 120, 300, 10, 5);
        this.progressBar = this.add.graphics();

        const loadFonts = (callback) => {
            window.WebFont.load({
                google: {
                    families: ['Tektur:400,600,700,800', 'Orbitron:400,600,700,800']
                },
                active: () => {

                    loadingLabel.setFontFamily('Orbitron');
                    this.progressText.setFontFamily('Orbitron');
                    this.statusText.setFontFamily('Tektur');
                    console.log('Fonts loaded successfully.');
                    callback();
                },
                inactive: () => {
                    console.warn('Could not load custom fonts. Using system default.');
                    callback();
                }
            });
        };

        const startFullLoad = () => {
            console.log('--- BootScene: Starting full asset loading ---');

            this.load.on('complete', () => {
                console.log('--- BootScene: All assets loaded. Creating sounds...');
                soundManager.createSounds();
                console.log('--- BootScene: Starting HangarConnectionScene. ---');
                this.scene.start('HangarConnectionScene', this.startData);
            });

            this.load.on('progress', (value, file) => {
                this.progressBar.clear();
                this.progressBar.fillStyle(0xFEBA00, 1);
                this.progressBar.fillRoundedRect(width / 2 - 150, height / 2 + 120, 300 * value, 10, 5);
                this.progressText.setText(`${Math.round(value * 100)}%`);

                if (file) {
                    this.statusText.setText(`Loading: ${file.key}`);
                }
            });

            preloadHangar.call(this);
            preloadGame.call(this);

            this.load.start();
        };

        loadFonts(startFullLoad);
    }

}