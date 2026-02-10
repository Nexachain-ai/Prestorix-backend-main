const MiningModel = require('../models/mining.model');
const { UserModel } = require('../models/user.model');



const transferMiningEarnings = async () => {
    try {
        const activeMiners = await MiningModel.find({ unlocked: false });
        if (!activeMiners.length) {
            console.log("No active miners found.");
            return;
        }

        for (const miner of activeMiners) {
            const user = await UserModel.findById(miner.user);
            if (!user) {
                console.error(`User not found for miner ${miner._id}`);
                continue;
            }

            if (!user.account) {
                user.account = { totalEarning: 0, currentIncome: 0 };
            }

            if (miner.earning <= 0) {
                console.log(`No earnings to transfer for miner ${miner._id}`);
                continue;
            }
            const earnings = miner.earning || 0;

            // Transfer earnings
            user.account.totalEarning = (user.account.totalEarning || 0) + earnings;
            user.account.currentIncome = (user.account.currentIncome || 0) + earnings;

            // Save updated user
            await user.save();

            // Reset mining earnings
            miner.earning = 0;
            miner.todayEarning = 0;
            await miner.save();
            return { success: true, message: 'Earnings transferred successfully.' };
        }
    } catch (error) {
        console.error('Error transferring earnings:', error);
        return { success: false, message: error.message };
    }
};


module.exports = transferMiningEarnings;