const getCurrentTokenValue = async (token) => {
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${token}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.price;
}

module.exports = getCurrentTokenValue;