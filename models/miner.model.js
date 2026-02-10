const mongoose = require("mongoose")

const minerSchema = new mongoose.Schema({
    // minerType: {
    //     type: String,
    //     enum: ["rent", "buy", "default"],
    //     default: "default"
    // },
    minerName: { type: String, default: null, unique: true },
    min: { type: Number, default: 0.0 },
    max: { type: Number, default: 0.0 },
    investment: { type: String, default: null },
    dailyEarning: { type: String, default: null },
    description: { type: String, default: null },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

const MinerModel = mongoose.model('Miner', minerSchema)

module.exports = { MinerModel }