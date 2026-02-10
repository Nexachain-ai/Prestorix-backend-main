const mongoose = require('mongoose');

const NebuluxPurchaseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Userdetail',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('NebuluxPurchase', NebuluxPurchaseSchema);