const MiningModel = require('../models/mining.model');

/**
 * Function to unlock mining records after 100 days.
 */
const unlockMiners = async () => {
    try {
        const miningRecords = await MiningModel.find({ isLocked: true });

        for (const record of miningRecords) {
            if (record.shouldUnlock()) {
                record.isLocked = false;
                await record.save();
                console.log(`Miner locked disabled for ID: ${record._id}`);
            }
        }

        console.log("Mining unlock process completed.");
    } catch (error) {
        console.error("Error unlocking mining records:", error);
    }
};

module.exports = unlockMiners;