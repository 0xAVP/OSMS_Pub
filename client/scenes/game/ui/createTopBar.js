import {DEPTHS} from './depths';

export function createTopBar(scene) {

    const scaleFactor = Math.min(scene.startWidth / 1920, scene.startHeight / 1080);
    const scale = (value) => value * scaleFactor;

    const BAR_WIDTH = scale(450);
    const BAR_HEIGHT = scale(55);
    const CORNER_CUT = scale(20);

    const container = scene.add.container(scene.startWidth / 2, -BAR_HEIGHT).setDepth(DEPTHS.UI_HUD);

    const background = scene.add.graphics();
    background.fillStyle(0x0A0A1A, 0.3);
    const points = [
        {x: -BAR_WIDTH / 2, y: 0},
        {x: BAR_WIDTH / 2, y: 0},
        {x: BAR_WIDTH / 2, y: BAR_HEIGHT - CORNER_CUT},
        {x: BAR_WIDTH / 2 - CORNER_CUT, y: BAR_HEIGHT},
        {x: -BAR_WIDTH / 2, y: BAR_HEIGHT}
    ];
    background.fillPoints(points, true);
    background.lineStyle(2, 0x41C6FF, 0.3);
    background.beginPath();
    background.moveTo(-BAR_WIDTH / 2, 1);
    background.lineTo(BAR_WIDTH / 2, 1);
    background.strokePath();
    container.add(background);

    const separator = scene.add.graphics();
    separator.fillStyle(0x41C6FF, 0.5);
    separator.fillRect(-1, BAR_HEIGHT * 0.15, 2, BAR_HEIGHT * 0.7);
    container.add(separator);

    const timeGroup = scene.add.container(-BAR_WIDTH / 4, BAR_HEIGHT / 2);

    const timeLabel = scene.add.text(0, 0, 'TIME', {
        fontFamily: 'Tektur',
        fontSize: `${scale(14)}px`,
        color: '#a1c4fd'
    }).setOrigin(0.5);

    const gameTimeText = scene.add.text(timeLabel.x + timeLabel.width + scale(15), 0, '00:00:00', {
        fontFamily: 'Orbitron',
        fontSize: `${scale(20)}px`,
        color: '#ffffff'
    }).setOrigin(0.5);

    const timeGroupWidth = timeLabel.width + scale(15) + gameTimeText.width;
    timeLabel.x = -timeGroupWidth / 2 + timeLabel.width / 2;
    gameTimeText.x = timeLabel.x + timeLabel.width / 2 + scale(15) + gameTimeText.width / 2;

    timeGroup.add([timeLabel, gameTimeText]);
    container.add(timeGroup);

    const killsGroup = scene.add.container(BAR_WIDTH / 4, BAR_HEIGHT / 2);

    const killsLabel = scene.add.text(0, 0, 'KILLS', {
        fontFamily: 'Tektur',
        fontSize: `${scale(14)}px`,
        color: '#a1c4fd'
    }).setOrigin(0.5);

    const killCountText = scene.add.text(killsLabel.x + killsLabel.width + scale(10), 0, '0000', {
        fontFamily: 'Orbitron',
        fontSize: `${scale(20)}px`,
        color: '#E663CB'
    }).setOrigin(0.5);

    const killsGroupWidth = killsLabel.width + scale(10) + killCountText.width;
    killsLabel.x = -killsGroupWidth / 2 + killsLabel.width / 2;
    killCountText.x = killsLabel.x + killsLabel.width / 2 + scale(10) + killCountText.width / 2;

    killsGroup.add([killsLabel, killCountText]);
    container.add(killsGroup);

    return {
        container,
        gameTimeText,
        killCountText
    };
}