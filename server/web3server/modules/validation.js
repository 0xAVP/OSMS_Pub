function isValidWalletAddress(walletAddress) {
    return typeof walletAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
}

function isValidNumber(value, min, max) {
    const num = Number(value);
    return Number.isFinite(num) && num >= min && num <= max;
}

function isValidString(value, maxLength) {
    return typeof value === 'string' && value.length <= maxLength;
}

module.exports = {
    isValidWalletAddress,
    isValidNumber,
    isValidString
};