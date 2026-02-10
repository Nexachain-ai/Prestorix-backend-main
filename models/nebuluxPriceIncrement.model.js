const mongoose = require('mongoose');

const nebuluxPriceIncrementSchema = new mongoose.Schema({
    nebuluxId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nebulux',
        required: true
    },
    previousPrice: {
        type: Number,
        required: true
    },
    incrementedPrice: {
        type: Number,
        required: true
    },
    incrementPercentage: {
        type: Number,
        default: 1 // Default increment is 1%
    },
    stockSoldAtIncrement: {
        type: Number,
        required: true // Number of stocks sold that triggered this increment
    },
    prevValue: {
        type: Number,
        default: 0 // Optional: could represent stock value before increment
    },
    currentValue: {
        type: Number,
        default: 0 // Optional: could represent stock value after increment
    },
    incrementAtQty: {
        type: Number,
        default: null // The stock quantity threshold at which increment should happen
    },
    incrementAtQtyLeft: {
        type: Number,
        default: null // How much stock left before the next increment
    },
    incrementedAt: {
        type: Date,
        default: Date.now // Timestamp of the price increment
    }
});

module.exports = mongoose.model('NebuluxPriceIncrement', nebuluxPriceIncrementSchema);
