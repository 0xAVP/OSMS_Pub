import Phaser from 'phaser';
import {WithdrawView} from './components/WithdrawView.js';
import {DepositView} from './components/DepositView.js';

const STYLES = {
    tabActive: {fontFamily: 'Tektur', fontSize: '18px', color: '#ffffff', fontStyle: 'bold'},
    tabInactive: {fontFamily: 'Tektur', fontSize: '18px', color: '#888888'},
};

const LAYOUT = {
    TOP_BAR_HEIGHT: 60,
};

export function createTokenTab(scene, width, height) {
    const container = scene.add.container(0, 0);

    const contentHeight = height - LAYOUT.TOP_BAR_HEIGHT;

    const contentContainer = scene.add.container(0, LAYOUT.TOP_BAR_HEIGHT);

    const withdrawView = new WithdrawView(scene, width, contentHeight);
    const depositView = new DepositView(scene, width, contentHeight);

    contentContainer.add([withdrawView, depositView]);
    depositView.setVisible(false);

    const tabBg = scene.add.graphics();
    tabBg.lineStyle(1, 0x41C6FF, 0.3);
    tabBg.lineBetween(0, LAYOUT.TOP_BAR_HEIGHT - 10, width, LAYOUT.TOP_BAR_HEIGHT - 10);

    const btnY = 20;

    const withdrawTabBtn = scene.add.text(width * (1 / 6), btnY, 'WITHDRAW', STYLES.tabActive)
        .setOrigin(0.5).setInteractive({useHandCursor: true});

    const depositTabBtn = scene.add.text(width * 0.5, btnY, 'DEPOSIT', STYLES.tabInactive)
        .setOrigin(0.5).setInteractive({useHandCursor: true});

    const historyTabBtn = scene.add.text(width * (5 / 6), btnY, 'HISTORY', STYLES.tabInactive)
        .setOrigin(0.5).setInteractive({useHandCursor: true});

    const indicatorWidth = width / 3;
    const activeIndicator = scene.add.rectangle(width * (1 / 6), LAYOUT.TOP_BAR_HEIGHT - 10, indicatorWidth, 2, 0xFEBA00);

    container.add([tabBg, withdrawTabBtn, depositTabBtn, historyTabBtn, activeIndicator, contentContainer]);

    const switchTab = (mode) => {
        if (mode === 'history') {

            scene.modalManager.show('transactionHistory', {filter: 'tokens'});
            return;
        }

        withdrawTabBtn.setStyle(STYLES.tabInactive);
        depositTabBtn.setStyle(STYLES.tabInactive);

        withdrawView.setVisible(false);
        depositView.setVisible(false);

        if (mode === 'withdraw') {
            withdrawTabBtn.setStyle(STYLES.tabActive);
            withdrawView.setVisible(true);
            scene.tweens.add({targets: activeIndicator, x: width * (1 / 6), duration: 200, ease: 'Sine.easeOut'});
        } else if (mode === 'deposit') {
            depositTabBtn.setStyle(STYLES.tabActive);
            depositView.setVisible(true);
            scene.tweens.add({targets: activeIndicator, x: width * 0.5, duration: 200, ease: 'Sine.easeOut'});
        }
    };

    withdrawTabBtn.on('pointerdown', () => switchTab('withdraw'));
    depositTabBtn.on('pointerdown', () => switchTab('deposit'));
    historyTabBtn.on('pointerdown', () => switchTab('history'));

    return container;
}