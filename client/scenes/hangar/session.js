import {CONFIG} from '../core/config.js';
import {Utils} from "../core/utils";

export async function checkSession(scene, options = {forceRefresh: false}) {
    const session = scene.registry.get('session');

    if (!options.forceRefresh) {
        if (session && session.token && session.expiry) {

            if (Utils.getCurrentServerTime(scene) < session.expiry - CONFIG.client.hangar.SESSION_BUFFER_TIME_MS) {
                return {isValid: true};
            }
        }
    }

    console.log('Session invalid/expired, attempting signature...');

    try {
        const signer = scene.signer;
        const address = await signer.getAddress();

        const challengeResponse = await fetch(`${CONFIG.servers.web3}/verify-wallet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({walletAddress: address})
        });

        const challengeData = await challengeResponse.json();
        if (!challengeData.success || !challengeData.challenge) {
            throw new Error('Failed to get auth challenge');
        }

        const signature = await signer.signMessage(challengeData.challenge);

        const verifyResponse = await fetch(`${CONFIG.servers.web3}/verify-wallet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                walletAddress: address,
                signature: signature

            })
        });

        const data = await verifyResponse.json();
        if (!verifyResponse.ok || !data.success) {
            throw new Error(data.error || 'Verification failed');
        }

        scene.registry.set('session', {
            token: data.sessionToken,
            expiry: data.expiry
        });

        return {isValid: true};
    } catch (error) {
        console.error('Handshake failed:', error.message);
        return {isValid: false, message: error.message};
    }
}

export function isSessionFreshEnoughForAction(scene) {
    const session = scene.registry.get('session');

    const TOTAL_SESSION_DURATION_MS = CONFIG.client.hangar.SESSION_DURATION_MS;
    const FRESHNESS_WINDOW_MS = CONFIG.client.hangar.SESSION_FRESHNESS_MS;

    if (session && session.expiry) {
        const remainingTime = session.expiry - Utils.getCurrentServerTime(scene);

        if (remainingTime > TOTAL_SESSION_DURATION_MS - FRESHNESS_WINDOW_MS) {
            return {isFresh: true};
        }
    }

    return {isFresh: false};
}