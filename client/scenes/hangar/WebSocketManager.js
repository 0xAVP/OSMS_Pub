import {CONFIG} from '../core/config.js';
import Phaser from 'phaser';
import {encode, decode} from '@msgpack/msgpack';

class WebSocketManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.clientId = null;
        this.isWsConnected = false;
        this.isWsIdentified = false;
        this.pendingRequests = new Map();
        this.sessionToken = null;
        this.walletAddress = null;
    }

    async connect(sessionToken, walletAddress) {
        if (this.isWsConnected) {
            console.log('WS Manager: Already connected.');
            return;
        }

        console.log('WS Manager: Starting connection...');
        this.sessionToken = sessionToken;
        this.walletAddress = walletAddress;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                this.ws = new WebSocket(CONFIG.servers.db);
                this.ws.binaryType = "arraybuffer";

                await new Promise((resolve, reject) => {
                    this.ws.onopen = () => {
                        this.isWsConnected = true;
                        console.log('WS Manager: WebSocket connection opened.');

                        this._identify();

                        resolve();
                    };

                    this.ws.onmessage = (event) => this._handleMessage(event);

                    this.ws.onerror = (error) => {
                        console.error('WS Manager: WebSocket error:', error);
                        reject(new Error('WebSocket connection error'));
                    };

                    this.ws.onclose = () => {
                        console.log('WS Manager: WebSocket connection closed.');
                        this.isWsConnected = false;
                        this.isWsIdentified = false;
                        this.pendingRequests.forEach(({reject}) => reject(new Error('Connection lost')));
                        this.pendingRequests.clear();
                        this.emit('disconnected');
                    };
                });

                return;

            } catch (error) {
                console.error(`WS Manager: Connection attempt ${attempt} failed.`);
                if (attempt >= 3) {
                    this.emit('error', 'Failed to connect after multiple attempts.');
                    throw error;
                }
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }

    _handleMessage(event) {
        if (event.data instanceof ArrayBuffer) {
            try {
                const data = decode(event.data);
                console.log('%c[RAW MESSAGE FROM SERVER]:', 'color: cyan; font-weight: bold;', data);

                if (this.pendingRequests.has(data.requestId)) {
                    const promise = this.pendingRequests.get(data.requestId);
                    const payload = data.payload;

                    if (payload && payload.success === true) {

                        if (data.type === 'identified') {
                            this.clientId = payload.clientId;
                            this.isWsIdentified = true;
                            const delta = payload.serverTime - Date.now();
                            this.emit('identified', {time_delta: delta});

                        }

                        promise.resolve(payload);

                    } else {

                        const errorMessage = payload ? payload.error : `Invalid response for ${data.type}`;
                        const finalError = new Error(errorMessage || `Server responded for '${data.type}' without success:true`);

                        console.error(
                            `%c[PROMISE REJECTED]: Request '${data.type}' failed validation.`,
                            'color: red; font-weight: bold;',
                            {reason: finalError.message, payload: payload}
                        );

                        promise.reject(finalError);
                        this.emit('error', finalError);
                    }

                    this.pendingRequests.delete(data.requestId);
                    return;
                }

                switch (data.type) {
                    case 'new-mail':
                        this.emit('new-mail', data.payload);
                        break;
                    case 'actual-exp':
                        this.emit('actual-exp', data.payload);
                        break;
                    case 'tx-history-updated':
                        console.log('WS Manager: History updated event received');
                        this.emit('tx-history-updated', data.payload);
                        break;
                    case 'error':
                        if (data.payload === 'Connection replaced by new session') {
                            this.emit('connection-replaced');
                        }
                        break;
                    default:
                        console.warn('WS Manager: Unhandled push message type:', data.type);
                }
            } catch (error) {
                console.error('WS Manager: Failed to decode msgpack message:', error);
            }
        } else {
            console.warn('WS Manager: Received non-binary message, which is not expected:', event.data);
        }

    }

    sendMessage(type, payload = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isWsConnected) {
                return reject(new Error('Cannot send message: Not connected.'));
            }
            if (!this.isWsIdentified) {
                return reject(new Error('Cannot send message: Not identified with the server.'));
            }

            const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const message = {type, requestId, payload};

            this.pendingRequests.set(requestId, {resolve, reject});
            this.ws.send(encode(message));
        });
    }

    _identify() {
        const payload = {
            clientType: 'client',
            walletAddress: this.walletAddress,
            sessionToken: this.sessionToken,
        };
        const requestId = `${Date.now()}-identify`;
        const message = {type: 'identify', requestId, payload};

        this.pendingRequests.set(requestId, {
            resolve: () => {
            },
            reject: (err) => console.error("Identification request failed:", err)
        });
        this.ws.send(encode(message));
    }

    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnected');
            this.ws = null;
        }
        this.isWsConnected = false;
        this.isWsIdentified = false;
        console.log('WS Manager: Disconnected.');
    }
}

export const webSocketManager = new WebSocketManager();