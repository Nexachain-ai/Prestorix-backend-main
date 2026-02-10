// utils/nebuluxPriceManager.js


const Nebulux = require('../models/nebulux.model'); // adjust path if needed
const nebuluxPriceIncrementModel = require('../models/nebuluxPriceIncrement.model');

const incrementNebuluxPriceIfNeeded = async (nebuluxCoin, threshold = 1000, incrementPercentage = 2) => {
    try {
        const stockSold = nebuluxCoin.sold;

        if (stockSold !== 0 && stockSold >= nebuluxCoin.lastIncrementAt + threshold) {
            const incrementsCount = Math.floor((stockSold - nebuluxCoin.lastIncrementAt) / threshold);

            for (let i = 0; i < incrementsCount; i++) {
                const previousPrice = nebuluxCoin.price;
                const incrementAmount = previousPrice * (incrementPercentage / 100);
                const newPrice = Number(previousPrice + incrementAmount); // round to 2 decimal places

                nebuluxCoin.price = newPrice;

                const priceIncrement = new nebuluxPriceIncrementModel({
                    nebuluxId: nebuluxCoin._id,
                    previousPrice: previousPrice,
                    incrementedPrice: newPrice,
                    incrementPercentage: incrementPercentage,
                    stockSoldAtIncrement: nebuluxCoin.lastIncrementAt + (i + 1) * threshold,
                    prevValue: nebuluxCoin.lastIncrementAt + (i * threshold),
                    currentValue: nebuluxCoin.lastIncrementAt + ((i + 1) * threshold),
                    incrementedAt: new Date(),
                    incrementAtQty: threshold,
                    incrementAtQtyLeft: Math.max(0, threshold - ((stockSold - nebuluxCoin.lastIncrementAt) % threshold)),
                });

                await priceIncrement.save();
            }

            nebuluxCoin.lastIncrementAt += incrementsCount * threshold;
            await nebuluxCoin.save();
        }
    } catch (err) {
        console.error("Error incrementing Nebulux price:", err);
        throw err;
    }
};

module.exports = { incrementNebuluxPriceIfNeeded };