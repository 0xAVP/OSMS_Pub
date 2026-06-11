const WebSocket = require('ws');
const {encode} = require('@msgpack/msgpack');
const CONFIG = require('../core/config');
const logger = require("../core/logger");

const trafficMonitor = {
    totalBytes: 0,
    packetCount: 0,
};

setInterval(() => {

    trafficMonitor.totalBytes = 0;
    trafficMonitor.packetCount = 0;
}, 1000);

function safeSend(ws, messageObject, callback) {
    if (ws.readyState !== WebSocket.OPEN) {

        if (callback) callback(new Error("WebSocket is not open."));
        return;
    }

    const encodedMessage = encode(messageObject);
    const sim = CONFIG.networkSimulation;

    trafficMonitor.totalBytes += encodedMessage.length;
    trafficMonitor.packetCount++;

    if (sim.enabled) {

        if (Math.random() < sim.packetLossChance) {

            return;
        }

        const jitter = (Math.random() * 2 - 1) * sim.jitterMs;
        const totalDelay = Math.max(0, sim.baseLatencyMs + jitter);

        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(encodedMessage, callback);
            }
        }, totalDelay);
    } else {

        ws.send(encodedMessage, callback);
    }
}

module.exports = {safeSend};