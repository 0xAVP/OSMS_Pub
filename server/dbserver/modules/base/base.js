const mongoose = require('mongoose');
const baseSchema = require('./schema');

const Base = mongoose.model('bases', baseSchema);

async function createBase(walletAddress) {
    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || typeof walletAddress !== 'string' || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        throw new Error('Invalid walletAddress: must be a valid Ethereum address');
    }
    try {
        let base = await Base.findOne({walletAddress}).lean();
        if (!base) {
            base = new Base({walletAddress});
            await base.save();
            console.log(`dbServer: Created base for: ${walletAddress}`);
        }
    } catch (error) {
        console.error('dbServer: Error creating base:', error);
        throw error;
    }
}

async function getBase(walletAddress) {
    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || typeof walletAddress !== 'string' || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        throw new Error('Invalid walletAddress: must be a valid Ethereum address');
    }
    try {
        const base = await Base.findOne(
            {walletAddress},
            {_id: 0, __v: 0, walletAddress: 0}
        ).lean();
        if (!base) {
            console.log(`dbServer: Base not found for walletAddress: ${walletAddress}`);
            return {success: false, error: 'Base not found'};
        }
        console.log(`dbServer: Fetched base for walletAddress: ${walletAddress}`);
        return {success: true, base: base.base};
    } catch (error) {
        console.error(`dbServer: Error fetching base for walletAddress ${walletAddress}: ${error.message}`);
        throw error;
    }
}

module.exports = {Base, createBase, getBase};