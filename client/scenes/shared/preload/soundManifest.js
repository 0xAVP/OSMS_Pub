/**
 * Единый манифест для всех звуковых ассетов в игре.
 * Ключ - это уникальное имя, которое мы будем использовать для проигрывания звука.
 * path - путь к файлу.
 * config - стандартные настройки для Phaser.Sound.SoundManager#add.
 */
export const SOUND_MANIFEST = {

    'hangar_music': {
        type: 'music',
        path: '/assets/audio/hangar_music.mp3',
        config: {loop: true, volume: 0.4}
    },
    'game_music': {
        type: 'music',
        path: '/assets/audio/game_music.mp3',
        config: {loop: true, volume: 0.4}
    },

    'shoot_sound1': {
        type: 'sfx',
        path: '/assets/audio/shoot_sound1.mp3',
        config: {loop: false, volume: 0.05}
    },
    'explosion_sound1': {
        type: 'sfx',
        path: '/assets/audio/explosion_sound1.mp3',
        config: {loop: false, volume: 0.6}
    },
    'player_damaged1': {
        type: 'sfx',
        path: '/assets/audio/player_damaged1.mp3',
        config: {loop: false, volume: 0.1}
    },
    'enemy_damaged1': {
        type: 'sfx',
        path: '/assets/audio/enemy_damaged1.mp3',
        config: {loop: false, volume: 1}
    }

};
