import React, {useEffect, useRef, useState} from 'react';
import Phaser from 'phaser';
import {useNavigate} from 'react-router-dom';
import {useAppKitAccount, useAppKitProvider, useAppKitNetwork, useAppKit} from '@reown/appkit/react';
import {activeNetwork} from './appkitConfig';
import HangarScene from './scenes/hangar/_Scene';
import GameScene from './scenes/game/_Scene';
import BootScene from './scenes/BootScene';
import HangarConnectionScene from './scenes/HangarConnectionScene';
import GameConnectionScene from './scenes/GameConnectionScene';
import RexBBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import './css/Game.css';

const GamePage = () => {
    const gameRef = useRef(null);
    const navigate = useNavigate();
    const {address, isConnected, status} = useAppKitAccount();
    const {walletProvider} = useAppKitProvider('eip155');
    const {caipNetwork, switchNetwork} = useAppKitNetwork();
    const {open} = useAppKit();
    const isCorrectNetwork = caipNetwork?.id === activeNetwork.id;
    const isInitializing = status === 'initializing' || status === 'reconnecting';

    useEffect(() => {

        if (!isConnected && gameRef.current) {
            console.log('Wallet disconnected. Destroying game instance.');
            destroyGame();
            return;
        }

        if (!isConnected || !isCorrectNetwork || !walletProvider) {
            return;
        }

        if (!gameRef.current) {
            console.log('GamePage: Requirements met. Initializing Phaser...');
            initGame();
        }

        const handleKeyDown = (event) => {
            if (event.key === 'F11') event.preventDefault();
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            destroyGame();
        };

    }, [isConnected, walletProvider, isCorrectNetwork, address]);

    const initGame = () => {
        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: 'phaser-game',
            physics: {
                default: 'arcade',
                arcade: {gravity: {y: 0}, fps: 60, debug: false}
            },
            dom: {createContainer: true},
            plugins: {
                global: [
                    {key: 'rexBBCodeTextPlugin', plugin: RexBBCodeTextPlugin, start: true}
                ],
                scene: [
                    {key: 'rexUI', plugin: UIPlugin, mapping: 'rexUI'},
                ]
            },
            scale: {mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH},
            render: {antialias: true, pixelArt: false}
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        game.registry.set('walletProvider', walletProvider);
        game.registry.set('walletAddress', address);
        game.registry.set('session', {token: null, expiry: 0});

        console.log('Phaser initialized. Wallet injected into Registry.');

        game.scene.add('BootScene', BootScene, false);
        game.scene.add('HangarConnectionScene', HangarConnectionScene, false);
        game.scene.add('GameConnectionScene', GameConnectionScene, false);
        game.scene.add('HangarScene', HangarScene, false);
        game.scene.add('GameScene', GameScene, false);
        game.scene.start('BootScene', {walletAddress: address, navigate});
    };

    const destroyGame = () => {
        if (gameRef.current) {
            console.log('GamePage: Destroying game instance.');
            const hangarScene = gameRef.current.scene.getScene('HangarScene');
            if (hangarScene && typeof hangarScene.cleanUpHangarScene === 'function') {
                hangarScene.cleanUpHangarScene();
            }

            const connectionScene = gameRef.current.scene.getScene('HangarConnectionScene');
            if (connectionScene && typeof connectionScene.cleanUpConnectionScene === 'function') {
                connectionScene.cleanUpConnectionScene();
            }

            gameRef.current.destroy(true);
            gameRef.current = null;
        }
    };

    if (isInitializing) {
        return (
            <div style={overlayStyle}>
                <div className="loading-spinner"></div>
                <p style={{marginTop: 20, color: '#888'}}>INITIALIZING SECURE CONNECTION...</p>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div style={overlayStyle}>
                <h1 style={{color: 'white', marginBottom: '10px'}}>ACCESS RESTRICTED</h1>
                <p style={{color: '#aaa', marginBottom: '30px'}}>
                    {/* ИЗМЕНЕНИЕ: Добавляем информацию о сети */}
                    Connection to <strong>{activeNetwork.name}</strong> required to access Hangar.
                </p>
                <button
                    onClick={() => open()}
                    style={buttonStyle}
                >
                    {/* ИЗМЕНЕНИЕ: Текст кнопки */}
                    CONNECT TO {activeNetwork.name.toUpperCase()}
                </button>
            </div>
        );
    }

    if (!isCorrectNetwork) {
        return (
            <div style={overlayStyle}>
                <h1 style={{color: '#ff4d4d', marginBottom: '10px'}}>WRONG NETWORK DETECTED</h1>
                <p style={{color: '#aaa', marginBottom: '30px'}}>
                    Please switch your communication frequency to {activeNetwork.name}.
                </p>
                <button
                    onClick={() => switchNetwork(activeNetwork)}
                    style={{...buttonStyle, borderColor: '#ff4d4d', color: '#ff4d4d'}}
                >
                    SWITCH NETWORK
                </button>
            </div>
        );
    }
    return <div id="phaser-game"/>;
};

const overlayStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    background: 'radial-gradient(circle at center, #1a1c29 0%, #000000 100%)',
    color: 'white',
    fontFamily: 'Orbitron, sans-serif',
    zIndex: 9999,
    position: 'relative'
};

const buttonStyle = {
    padding: '15px 40px',
    fontSize: '18px',
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.5)',
    border: '2px solid #42DA9D',
    color: '#42DA9D',
    fontFamily: 'Tektur, sans-serif',
    fontWeight: 'bold',
    letterSpacing: '1px',
    transition: 'all 0.3s ease'
};

export default GamePage;