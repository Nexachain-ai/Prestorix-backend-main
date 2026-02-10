const { UserModel } = require('../models/user.model'); // Assuming your user model file is User.js
const IncomeHistory = require('../models/incomeHistory.model'); // Adjust path as needed
  const PlanModel = require('../models/plan.model'); 
const distributeLevelIncomeController = async (userId, planId) => {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        if (!planId) {
            throw new Error("Plan ID is required");
        }

        const levelCommissions = [6, 3, 2, 2, 1.5, 1.5, 1, 1, 1, 1];
        
        let buyer = await UserModel.findById(userId).populate("sponsor");
        // console.log(buyer);
        
        if (!buyer) {
            throw new Error("User not found");
        }

        // Get plan details separately
      // Adjust path as needed
        const plan = await PlanModel.findById(planId);
        
        if (!plan) {
            throw new Error("Plan not found");
        }

        const investedAmount = plan.price || 0;
        
        if (investedAmount <= 0) {
            throw new Error("Invalid plan amount");
        }

        let current = buyer;
        let sponsor = buyer.sponsor;

        for (let level = 0; level < 10 && sponsor; level++) {
            sponsor = await UserModel.findById(sponsor._id).populate("partners sponsor");
            
            const requiredDirects = level + 1;
            const actualDirects = sponsor.partners?.length || 0;

            // Skip if not enough directs
            if (actualDirects < requiredDirects) {
                current = sponsor;
                sponsor = sponsor.sponsor;
                continue;
            }

            const alreadyGiven = sponsor.referralIncomes.some(income => 
                income.from?.toString() === buyer._id.toString()
            );

            if (alreadyGiven) {
                current = sponsor;
                sponsor = sponsor.sponsor;
                continue;
            }

            const percentage = levelCommissions[level];
            const income = (investedAmount * percentage) / 100;

            sponsor.account.totalReferralEarning += income;
            sponsor.account.totalEarning += income;
            sponsor.account.currentIncome = sponsor.account.totalEarning - sponsor.account.totalWithdrawal;

            sponsor.referralIncomes.push({
                income,
                from: buyer._id,
                date: new Date()
            });

            await sponsor.save();

            await IncomeHistory.create({
                user: sponsor._id,
                fromUser: buyer._id,
                planId: planId, // Added planId to income history
                level: level + 1,
                amount: income,
                percent: percentage,
                type: "Referral Income",
                date: new Date()
            });

            current = sponsor;
            sponsor = sponsor.sponsor;
        }

        return {
            success: true,
            message: "Level income distributed successfully"
        };

    } catch (err) {
        console.error("Level income distribution error:", err);
        throw new Error(`Level income distribution failed: ${err.message}`);
    }
};
const getIncomeHistory = async (req, res) => {
  try {
    const { userId } = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const history = await IncomeHistory.find({ user: userId })
      .populate("fromUser", "userId name")  
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      message: "Income history fetched successfully",
      data: history
    });

  } catch (error) {
    console.error("Error fetching income history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



module.exports = {
    distributeLevelIncomeController,
    getIncomeHistory
}