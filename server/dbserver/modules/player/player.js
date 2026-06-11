const mongoose = require('mongoose');
const playerSchema = require('./schema');
const {createInventory} = require('../inventory/inventory');
const {createBooster} = require('../booster/booster');
const {createBase} = require('../base/base');
const {createFactory} = require('../factory/factory');
const {customAlphabet} = require('nanoid');
const generateCode = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

const Player = mongoose.model('players', playerSchema);

async function getPlayerByWalletAddress(walletAddress) {

    if (!walletAddress || typeof walletAddress !== 'string') return null;
    return Player.findOne({walletAddress: walletAddress.toLowerCase()}).lean();
}

async function createPlayer(walletAddress) {

    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        throw new Error('Invalid walletAddress');
    }
    try {
        let player = await Player.findOne({walletAddress}).lean();
        if (!player) {

            const nickname = walletAddress.length >= 7
                ? walletAddress.slice(-5)
                : walletAddress;
            player = new Player({
                walletAddress,
                nickname,
                registered: new Date(),
                referralCode: generateCode()
            });
            await player.save();
            console.log(`dbServer: Created new player: ${walletAddress} with nickname: ${nickname}`);

            await createInventory(walletAddress);
            await createBooster(walletAddress);
            await createBase(walletAddress);
            await createFactory(walletAddress);
        }
    } catch (error) {
        console.error('dbServer: Error creating player:', error);
        throw error;
    }
}

async function getPlayerExp(walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    if (!walletAddress || typeof walletAddress !== 'string') {
        return null;
    }
    try {

        const player = await Player.findOne({walletAddress: walletAddress}, 'exp').lean();

        return player ? player.exp : null;
    } catch (error) {
        console.error(`dbServer: Error fetching player EXP for ${walletAddress}:`, error);
        throw error;
    }
}

module.exports = {Player, createPlayer, getPlayerByWalletAddress, getPlayerExp};