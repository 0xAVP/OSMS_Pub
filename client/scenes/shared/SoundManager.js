import {SOUND_MANIFEST} from './preload/soundManifest';

class SoundManager {
    constructor() {
        /** @private @type {Phaser.Scene} */
        this.scene = null;
        /** @private @type {Map<string, Phaser.Sound.BaseSound>} */
        this.musicTracks = new Map();
        this.isMuted = false;
    }

    init(scene) {
        this.scene = scene;
        this.scene.sound.mute = this.isMuted;
    }

    preloadSounds() {
        if (!this.scene) {
            console.error('SoundManager: Must be initialized before preloading.');
            return;
        }
        console.log('SoundManager: Preloading all sounds...');
        for (const key in SOUND_MANIFEST) {
            this.scene.load.audio(key, SOUND_MANIFEST[key].path);
        }
    }

    /**
     * Создает экземпляры ТОЛЬКО для звуков с type: 'music'.
     * SFX будут создаваться на лету для разрешения наложения.
     */
    createSounds() {
        if (!this.scene) {
            console.error('SoundManager: Must be initialized before creating sounds.');
            return;
        }
        this.musicTracks.clear();
        console.log('SoundManager: Creating music track instances...');
        for (const key in SOUND_MANIFEST) {

            if (SOUND_MANIFEST[key].type === 'music') {
                const sound = this.scene.sound.add(key, SOUND_MANIFEST[key].config);
                this.musicTracks.set(key, sound);
            }
        }
        console.log(`SoundManager: ${this.musicTracks.size} music tracks created.`);
    }

    /**
     * Воспроизводит музыку из предсозданных треков.
     * @param {string} key - Ключ музыки из SOUND_MANIFEST.
     */
    playMusic(key) {

        if (SOUND_MANIFEST[key]?.type !== 'music') {
            console.warn(`SoundManager: Attempted to play "${key}" as music, but it is typed as SFX. Use playSfx() instead.`);
            return;
        }

        const sound = this.musicTracks.get(key);
        if (sound && !sound.isPlaying) {

            this.musicTracks.forEach((track, trackKey) => {
                if (trackKey !== key && track.isPlaying) {
                    track.stop();
                }
            });
            sound.play();
        } else if (!sound) {
            console.warn(`SoundManager: Music track "${key}" not found. Was createSounds() called?`);
        }
    }

    /**
     * Воспроизводит звуковой эффект (SFX), создавая новый экземпляр для наложения.
     * @param {string} key - Ключ звука из SOUND_MANIFEST.
     */
    playSfx(key) {
        if (!this.scene) return;

        if (SOUND_MANIFEST[key]?.type !== 'sfx') {
            console.warn(`SoundManager: Attempted to play "${key}" as SFX, but it is typed as music. Use playMusic() instead.`);

        }

        this.scene.sound.play(key, SOUND_MANIFEST[key]?.config);
    }

    stop(key) {
        const sound = this.musicTracks.get(key);
        if (sound && sound.isPlaying) {
            sound.stop();
        } else {

        }
    }

    stopAll() {
        if (this.scene) {
            this.scene.sound.stopAll();
        }
    }

    setMute(muted) {
        this.isMuted = muted;
        if (this.scene) {
            this.scene.sound.mute = this.isMuted;
        }
    }
}

export const soundManager = new SoundManager();
