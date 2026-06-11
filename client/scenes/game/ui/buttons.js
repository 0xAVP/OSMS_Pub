import {DEPTHS} from './depths';
import Phaser from 'phaser';
import {selectTextureAndScale} from '../../core/utils';
import {CMT} from "../../core/gameStateKeys";
import {encode} from "@msgpack/msgpack";

export function createButtons(scene) {

    const targetIconSize = scene.scaleValue(48);
    const padding = scene.scaleValue(20);

    const backButtonContainer = scene.add.container(0, 0)
        .setDepth(DEPTHS.UI_BUTTONS)
        .setAlpha(0.5);

    const {textureKey, scale} = selectTextureAndScale(scene, 'back_to_hangar', targetIconSize);
    const icon = scene.add.image(0, -scene.scaleValue(5), textureKey)
        .setOrigin(0.5, 0.5)
        .setScale(scale);

    const labelStyle = {
        fontSize: `${scene.scaleValue(12)}px`,
        fontFamily: 'Tektur',
        color: '#ffffff',
        align: 'center',
        fontWeight: '600',
        shadow: {
            offsetX: scene.scaleValue(1),
            offsetY: scene.scaleValue(1),
            color: '#000000',
            blur: scene.scaleValue(3),
            fill: true
        }
    };

    const label = scene.add.text(0, icon.displayHeight / 2, 'BACK', labelStyle)
        .setOrigin(0.5, 0.5);

    backButtonContainer.add([icon, label]);

    const bounds = backButtonContainer.getBounds();
    backButtonContainer.setPosition(
        scene.startWidth - padding - (bounds.width / 2),
        padding + (bounds.height / 2)
    );

    const hitArea = new Phaser.Geom.Rectangle(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
    backButtonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, {useHandCursor: true});

    backButtonContainer.on('pointerdown', () => {
        if (!scene.isForfeiting) {
            if (scene.gameState === 'active' || scene.gameState === 'preparation' || scene.gameState === 'paused') {
                if (scene.ws && scene.ws.readyState === WebSocket.OPEN) {
                    console.log('[Button] Back to Hangar clicked. Sending forfeit request to server.');
                    scene.isForfeiting = true;
                    scene.ws.send(encode([CMT.FORFEIT_REQUEST]));
                } else {

                    scene.returnToHangar();
                }
            }
        }
    });

    backButtonContainer.on('pointerover', () => scene.tweens.add({
        targets: backButtonContainer,
        alpha: 1.0,
        duration: 150
    }));
    backButtonContainer.on('pointerout', () => scene.tweens.add({
        targets: backButtonContainer,
        alpha: 0.5,
        duration: 150
    }));

    return {backButton: backButtonContainer};
}