import Phaser from 'phaser';
import {TextInput} from '../../components/TextInput.js';
import {ActionButton} from '../../components/ActionButton.js';

const STYLES = {
    header: {fontFamily: 'Tektur', fontSize: '20px', color: '#e0e0e0', fontStyle: 'bold'},
    label: {fontFamily: 'Tektur', fontSize: '16px', color: '#cccccc'},
};

export function createReferralsTab(scene, width, height) {
    const container = scene.add.container(0, 0);

    let currentY = 20;

    const referralHeader = scene.add.text(0, currentY, 'Your Referral Code', STYLES.header);
    currentY += referralHeader.height + 15;

    const referralCode = `REF-${scene.walletAddress?.slice(2, 8).toUpperCase() || 'XXXXXX'}`;
    const referralInput = new TextInput(scene, width / 2, currentY + 20, {
        width: width * 0.7,
        placeholder: ''
    });
    referralInput.text = referralCode;

    referralInput.off('pointerdown');

    const copyButton = new ActionButton(scene, {
        x: width / 2 + (width * 0.7) / 2 + 60,
        y: currentY + 20,
        texture: 'use',
        text: 'Copy',
        scale: 0.6
    });
    copyButton.on('click', () => {
        navigator.clipboard.writeText(referralCode)
            .then(() => scene.sysMessageContainer.addMessage('Referral code copied!', 'SUCCESS'))
            .catch(() => scene.sysMessageContainer.addMessage('Failed to copy code.', 'ERROR'));
    });

    currentY += 80;

    const referredHeader = scene.add.text(0, currentY, 'Referred Players (0)', STYLES.header);
    currentY += referredHeader.height + 15;

    const noReferralsText = scene.add.text(0, currentY, 'You have not referred any players yet.', STYLES.label);

    container.add([
        referralHeader,
        referralInput,
        copyButton,
        referredHeader,
        noReferralsText
    ]);

    return container;
}