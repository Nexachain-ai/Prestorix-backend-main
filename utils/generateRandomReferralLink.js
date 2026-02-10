exports.generateRandomReferralLink = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ZCOIN${randomId}`;
};

exports.generateUserId = () => {
    const randomId = Math.floor(10 ** (5 + Math.random() * 3)) + Math.floor(Math.random() * 10 ** (Math.random() < 0.5 ? 1 : 2)); // Generate a random number with 6 to 8 digits
    return `ZCOIN${randomId}`;
}

exports.generateTxnId = () => {
    const randomId = Math.floor(10 ** (9 + Math.random() * 3)) + Math.floor(Math.random() * 10 ** (Math.random() < 0.5 ? 1 : 2)); // Generate a random number with 10 to 12 digits
    return `TXN-PRE${randomId}`;
}