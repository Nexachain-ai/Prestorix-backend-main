const mongoose = require('mongoose');

const NebuluxSchema = new mongoose.Schema({
    icon: {
        type: String,
        default: null
    },
    name: {
        type: String,
        required: true,
        default: null
    },
    price: {
        type: Number,
        default: 1 // 1 cent
    },
    supply: {
        type: Number,
        default: 25000000 // 100 million
    },
    sold: {
        type: Number,
        default: 0
    },
    estdValue: {
        type: Number,
        default: 0
    },
    lastIncrementAt: {
        type: Number,
        default: 0 // Tracks how many coins were sold when last price increment happened
    }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Nebulux', NebuluxSchema);