const mongoose = require('mongoose');
const boosterSchema = require('./schema');

const Booster = mongoose.model('boosters', boosterSchema);

async function createBooster(walletAddress) {
    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || typeof walletAddress !== 'string' || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        throw new Error('Invalid walletAddress: must be a valid Ethereum address');
    }
    try {
        let booster = await Booster.findOne({walletAddress}).lean();
        if (!booster) {
            booster = new Booster({walletAddress});
            await booster.save();
            console.log(`dbServer: Created booster for: ${walletAddress}`);
        }
    } catch (error) {
        console.error('dbServer: Error creating booster:', error);
        throw error;
    }
}

module.exports = {Booster, createBooster};