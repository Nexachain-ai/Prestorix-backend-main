const Plan = require("../models/plan.model")
const mongoose = require('mongoose');
const {UserModel} = require('../models/user.model'); 
const DailyIncomeHistory = require('../models/ROIhistory.model'); 

 const createPlan = async (req, res) => {
  try {
    const { name, price , monthlyROIpercentage , totalROIpercentage , lockin } = req.body;
    console.log(req.body);
    if (!price) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const plan = await new Plan({ name, price ,monthlyROIpercentage, totalROIpercentage , lockin }).save();
    res.status(201).json(plan);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Server error", message: error.message, success: false });
      
  }
};


const getPlans = async(req , res)=>{
  try {
    let plan = await Plan.find()
    res.status(201).json({message : "Plans fetched successfully" , data : plan , success : true})
  } catch (error) {
    res.status(500).json({message : "Intenal server error" ,error, success : false})
  }
}
const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const getDailyROI = async () => {
  try {
    const today = new Date();
    const dailyPercent = 6 / 30; // 0.2%

    const users = await UserModel.find({
      plan: { $exists: true, $not: { $size: 0 } },
      activeDate: { $ne: null }
    }).populate('plan');
    console.log(users)

    for (const user of users) {
      if (!user.activeDate) continue;

      for (const plan of user.plan) {
        if (!plan || !plan.price) continue;

        const investedAmount = plan.price;
        const lockInMonths = plan.lockin || 0;

        const lockinExpiryDate = new Date(user.activeDate);
        lockinExpiryDate.setMonth(lockinExpiryDate.getMonth() + lockInMonths);

        if (today >= lockinExpiryDate) continue;

        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        const alreadyGiven = await DailyIncomeHistory.findOne({
          user: user._id,
          plan: plan._id,
          date: { $gte: startOfToday, $lt: endOfToday }
        });

        if (alreadyGiven) continue;

        const dailyIncome = (investedAmount * dailyPercent) / 100;

        user.account.totalEarning += dailyIncome;
        user.account.currentIncome += dailyIncome;

        await user.save();

        await DailyIncomeHistory.create({
          user: user._id,
          plan: plan._id,
          date: today,
          amount: dailyIncome
        });
      }
    }

    console.log("✅ Daily ROI distributed successfully for all users.");
  } catch (err) {
    console.error("❌ Daily ROI distribution error:", err.message);
  }
};



const getROIhistory = async(req , res)=>{
  try {
    let  data = await DailyIncomeHistory.find({})
  res.status(200).json({message : "Data fetched successfully" , data : data , success : true })
    
  } catch (error) {
  res.status(500).json({message : "Internal server error" , error , success : false })
  }
}




module.exports = {
    createPlan,
    getPlans,
    getDailyROI,
    getROIhistory
}