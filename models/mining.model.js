const mongoose = require("mongoose")

const miningSchema = new mongoose.Schema({
    miner: { type: mongoose.Schema.Types.ObjectId, ref: 'Miner' },
    isActive: { type: Boolean, default: false },
    token: { type: String, default: null },
    investment: { type: Number, default: 0.0 },
    earning: { type: Number, default: 0.0 },
    todayEarning: { type: Number, default: 0.0 },
    isLocked: { type: Boolean, default: true },
    unlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Userdetail' },
}, { timestamps: true, versionKey: false });

// Helper method to check if the mining record should be unlocked
miningSchema.methods.shouldUnlock = function () {
    const currentDate = new Date();
    const createdDate = new Date(this.createdAt);

    // Add 6 months to the createdDate
    const unlockDate = new Date(createdDate);
    unlockDate.setMonth(unlockDate.getMonth() + 6);

    return currentDate >= unlockDate;
};


const MiningModel = mongoose.model("Mining", miningSchema);

module.exports = MiningModel;