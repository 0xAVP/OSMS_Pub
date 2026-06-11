import {CMT, MK, MT} from '../../core/gameStateKeys';
import {encode} from '@msgpack/msgpack';

export class TimeSynchronizer {
    /**
     * @param {Phaser.Scene} scene - Сцена GameScene
     */
    constructor(scene) {
        this.scene = scene;
        this.samples = [];
        this.sampleCount = 10;
        this.currentSample = 0;
        this.isSyncing = false;
        this.pingInterval = 100;
    }

    start() {
        console.log('[TimeSync] Starting precision synchronization...');
        this.samples = [];
        this.currentSample = 0;
        this.isSyncing = true;
        this._sendPing();
    }

    _sendPing() {
        if (!this.scene.ws || this.scene.ws.readyState !== WebSocket.OPEN) return;

        const clientTime = Date.now();

        this.scene.ws.send(encode([CMT.TIME_SYNC_REQUEST, clientTime]));
    }

    handleResponse(payload) {
        if (!this.isSyncing) return;

        const now = Date.now();
        const clientSendTime = payload.c;
        const serverReceiveTime = payload.s;

        const rtt = now - clientSendTime;

        const latency = rtt / 2;

        const serverTimeNow = serverReceiveTime + latency;

        const offset = now - serverTimeNow;

        this.samples.push({rtt, offset});
        this.currentSample++;

        if (this.currentSample < this.sampleCount) {
            setTimeout(() => this._sendPing(), this.pingInterval);
        } else {
            this._finalize();
        }
    }

    _finalize() {
        this.isSyncing = false;
        if (this.samples.length === 0) return;

        this.samples.sort((a, b) => a.rtt - b.rtt);

        const bestSamplesCount = Math.max(1, Math.ceil(this.samples.length * 0.3));
        const bestSamples = this.samples.slice(0, bestSamplesCount);

        const avgOffset = bestSamples.reduce((sum, s) => sum + s.offset, 0) / bestSamples.length;
        const avgRtt = bestSamples.reduce((sum, s) => sum + s.rtt, 0) / bestSamples.length;

        this.scene.timeOffset = Math.round(avgOffset);

        this.scene.ping = Math.round(avgRtt);

        console.log(`[TimeSync] Complete. AvgRTT: ${this.scene.ping}ms. Precise Offset: ${this.scene.timeOffset}ms`);
    }
}