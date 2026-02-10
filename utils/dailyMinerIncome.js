const AdminModel = require('../models/admin.model');
const MiningModel = require('../models/mining.model');

/**
 * Function to calculate daily income for miners.
 */
const distributeDailyIncome = async () => {
    try {
        // Fetch admin settings to get minerEarningPercentage
        const admin = await AdminModel.findOne();
        if (!admin) {
            console.error("Admin minerEarningPercentage not found.");
            return;
        }

        const basePercentage = admin.minerEarningPercentage; // Base earning percentage (e.g., 1%)
        const minPercentage = basePercentage * 0.8; // 80% of base
        const maxPercentage = basePercentage * 1.2; // 120% of base

        // Fetch all active miners
        const activeMiners = await MiningModel.find({ unlocked: false });
        if (!activeMiners.length) {
            console.log("No active miners found.");
            return;
        }
        for (const miner of activeMiners) {
            // Generate a random percentage within the range
            const randomPercentage = (Math.random() * (maxPercentage - minPercentage) + minPercentage).toFixed(2);

            // Calculate daily earning
            const dailyEarning = (miner.investment * randomPercentage) / 100;

            // Update miner's earning
            miner.earning += dailyEarning;
            miner.todayEarning = dailyEarning;
            await miner.save();

            console.log(`Distributed ${dailyEarning} to miner ${miner._id} at ${randomPercentage}%`);
        }

        console.log("Daily income distribution completed.");
    } catch (error) {
        console.error("Error in distributing daily income:", error);
    }
};

module.exports = distributeDailyIncome;