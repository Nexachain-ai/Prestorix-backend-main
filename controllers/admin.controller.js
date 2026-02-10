const user = require('../models/admin.model');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const { getComparePassword, getHashPassword } = require('../utils/encrypt');
const { MinerModel } = require('../models/miner.model');
const { UserModel } = require('../models/user.model');
const MiningModel = require('../models/mining.model');
const { WithdrawalRequestModel } = require('../models/withdrawal.model');
const { TransactionModel } = require('../models/transaction.model');
const nebuluxModel = require('../models/nebulux.model');
const nebuluxPurchaseModel = require('../models/nebuluxPurchase.model');
const { WithdrawalUsdt } = require('./withdrawal.controller');
const incomeHistory = require("../models/incomeHistory.model")
const {Token} = require("../models/token.model");
const investment = require('../models/investment.model');
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin username
    const admin = await user.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    //compre password
    const isMatch = await getComparePassword(admin, password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate jdablooT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    // save token to cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Update last login
    admin.lastLogin = new Date();
    await admin.save(); 
    req.admin = admin;

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    next(error); // Forward kardena bhaiya error ko
  }
};

// Create Admin
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name, mobile } = req.body;

    // Validate input karegaaaaaaaa
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if admin already hai 
    const existingAdmin = await user.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin with this email already exists' });
    }
    const hashPassword = await getHashPassword(password);
    // Create kardo admin ko
    const newAdmin = new user({
      email,
      password: hashPassword,
      role: 'admin',
      name,
      mobile
    });

    await newAdmin.save();

    res.status(201).json({ message: 'Admin created successfully', admin: newAdmin });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: error.message });
  }
};


exports.getAdmin = async (req, res) => {
  try {
    const admin = req.admin;
    // dont send password and otp field in response
    res.status(200).json({ success: true, message: 'Admin data fetched successfully', data: admin });
  } catch (error) {
    console.error('Error getting admin:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.logoutAdmin = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ message: error.message });
  }
}

// forgot password
const otpStore = new Map(); // { "user_email": { otp, expiresAt } }
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await user.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    // send email to admin
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

    otpStore.set(email, { otp, expiresAt });

    await sendEmail(email, otp);

    res.status(200).json({ message: 'Password reset otp sent to email', otp });
  } catch (error) {
    console.error('Error forgot password:', error);
    res.status(500).json({ message: error.message });
  }
}
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    // Check if OTP is valid
    const storedOTP = otpStore.get(email);
    if (!storedOTP || storedOTP.otp !== otp || storedOTP.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await user.findOneAndUpdate({ email }, { password: hashedPassword });

    // Remove OTP from store after successful reset
    otpStore.delete(email);

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Error reset password:', error);
    res.status(500).json({ message: error.message });
  }
}




exports.createOrUpdateMiner = async (req, res) => {
  try {
    const { minerType, minerName, investment, dailyEarning, description, image, isActive } = req.body;
    const { id } = req.params;


    let url = image.startsWith('http://') || image.startsWith('https://')
      ? image
      : await uploadImageToImageKit(image, 'miners');
    if (!url) {
      return res.status(500).json({ message: 'Error uploading image' });
    }
    let miner;

    if (id) {
      // Update existing miner
      miner = await MinerModel.findByIdAndUpdate(
        id,
        { minerType, minerName, investment, dailyEarning, description, image: url, isActive },
        { new: true, runValidators: true }
      );

      if (!miner) {
        return res.status(404).json({ message: 'Miner not found' });
      }

      res.status(200).json({ message: 'Miner updated successfully', miner });
    } else {
      // Create new miner
      miner = await MinerModel.create({
        minerType,
        minerName,
        investment,
        dailyEarning,
        description,
        image: url,
        isActive
      });

      res.status(201).json({ message: 'Miner created successfully', miner });
    }
  } catch (error) {
    console.error('Error creating or updating miner:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMiners = async (req, res) => {
  try {
    const miners = await MinerModel.find();
    res.status(200).json({ success: true, message: "Miners data fetched successfully", data: miners });
  } catch (error) {
    console.error('Error getting miners:', error);
    res.status(500).json({ message: error.message });
  }
};


exports.updateReferralPercentages = async (req, res) => {
  try {
    const { levelPercentages } = req.body;
    const admin = req.admin;

    admin.levelPercentages = levelPercentages;
    await admin.save();

    const users = await UserModel.updateMany({}, { levelPercentages });
    await users.save()

    res.status(200).json({ message: 'Referral percentages updated successfully', levelPercentages });
  } catch (error) {
    console.error('Error updating referral percentages:', error);
    res.status(500).json({ message: error.message });
  }
}


exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select('-password -referralPercentages -otp -isVerified -__v -updatedAt')
    res.status(200).json({ success: true, message: "Users data fetched successfully", data: users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userDetails } = user._doc; // Exclude password from the response
    res.status(200).json({ success: true, message: "User data fetched successfully", data: userDetails });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.blockUnblockuser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    const message = user.isActive ? 'User unblocked successfully' : 'User blocked successfully';
    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getDashboardData = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const totalActiveUsers = await UserModel.countDocuments({ isActive: true });
    const totalInactiveUsers = await UserModel.countDocuments({ isActive: false });
    const totalLockedMinersCount = await MiningModel.countDocuments({ unlocked: false });
    const totalUnlockedMinersCount = await MiningModel.countDocuments({ unlocked: true, isLocked: false });
    const totalFund = await UserModel.aggregate([
      { $group: { _id: null, totalFund: { $sum: "$fund" } } }
    ]);
    const WithdrawalsHistory = await WithdrawalRequestModel.aggregate([
      { $group: { _id: null, totalWithdrawals: { $sum: "$amount" } } }
    ]);
    const totalWithdrawalCount = await WithdrawalRequestModel.countDocuments();
    const totalUsersEarnings = await UserModel.aggregate([
      { $group: { _id: null, totalEarnings: { $sum: { $ifNull: ["$account.totalEarnings", 0] } } } }
    ]);
    const totalMiningInvestment = await MiningModel.aggregate([
      { $group: { _id: null, totalInvestment: { $sum: "$investment" } } }
    ]);
    const totalReferralIncome = await UserModel.aggregate([
      { $unwind: "$referralIncomes" }, // Flatten the array
      { $group: { _id: null, totalReferralIncome: { $sum: { $ifNull: ["$referralIncomes.Income", 0] } } } }
    ]);


    res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        totalLockedMinersCount,
        totalUnlockedMinersCount,
        totalFund: totalFund[0]?.totalFund || 0,
        totalWithdrawalCount,
        totalReferralIncome: totalReferralIncome[0]?.totalReferralIncome || 0,
        totalMiningInvestment: totalMiningInvestment[0]?.totalInvestment || 0,
        totalWithdrawals: WithdrawalsHistory[0]?.totalWithdrawals || 0,
        totalUsersEarnings: totalUsersEarnings[0]?.totalEarnings || 0
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getPurchasedMinersHistory = async (req, res) => {
  try {
    const miners = await MiningModel.find().populate('miner').populate('user', 'email name mobile userId').sort({ createdAt: -1 });
    if (!miners) {
      return res.status(404).json({ message: 'No miners found' });
    }
    res.status(200).json({ success: true, message: "Purchased miners data fetched successfully", data: miners });
  } catch (error) {
    console.error('Error getting purchased miners history:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getReferralIncomeHistory = async (req, res) => {
  try {
    const users = await UserModel.find().populate('referralIncomes.from', 'name mobile userId').select('userId name referralIncomes').sort({ createdAt: -1 });
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    const referralIncomes = users.flatMap(user => user.referralIncomes.map(income => ({
      income: income.income,
      from: income.from,
      date: income.date,
      userId: user.userId,
      email: user.email,
      name: user.name,
      mobile: user.mobile
    })));

    res.status(200).json({ success: true, message: "Referral income history fetched successfully", data: referralIncomes });
  } catch (error) {
    console.error('Error getting referral income history:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getMinerIncomeHistory = async (req, res) => {
  try {
    const users = await UserModel.find().populate({
      path: 'miners',
      select: 'todayEarning token',
      populate: 'miner'
    }).select('userId name miners').sort({ createdAt: -1 });
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    const miners = users.flatMap(user => user.miners.map(miner => ({
      miner: miner,
      userId: user.userId,
      email: user.email,
      name: user.name,
      mobile: user.mobile
    })));

    res.status(200).json({ success: true, message: "Miner income history fetched successfully", data: miners });
  } catch (error) {
    console.error('Error getting miner income history:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getDepositHistory = async (req, res) => {
  try {
    const transactions = await TransactionModel.find({ type: 'deposit' }).populate('userId', 'email name mobile userId').sort({ createdAt: -1 });
    if (!transactions) {
      return res.status(404).json({ message: 'No deposit transactions found' });
    }
    res.status(200).json({ success: true, message: "Deposit history fetched successfully", data: transactions });
  } catch (error) {
    console.error('Error getting deposit history:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getWithdrawalHistory = async (req, res) => {
  try {
    // const users = await UserModel.find().populate('transaction', 'amount transactionType').select('userId name transaction').sort({ createdAt: -1 });
    // if (!users) {
    //   return res.status(404).json({ message: 'No users found' });
    // }
    // const deposits = users.flatMap(user => user.transaction
    //   .filter(transaction => transaction.transactionType === 'withdrawal')
    //   .map(transaction => ({
    //     amount: transaction.amount,
    //     transactionType: transaction.transactionType,
    //     userId: user.userId,
    //     email: user.email,
    //     name: user.name,
    //     mobile: user.mobile
    //   }))
    // );

    const deposits = await WithdrawalRequestModel.find().populate('userId', 'email name mobile userId walletAddress').sort({ createdAt: -1 });
    if (!deposits || deposits.length === 0) {
      return res.status(400).json({ success: true, message: 'No withdrawal requests found' });
    }

    res.status(200).json({ success: true, message: "Withdrawal history fetched successfully", data: deposits });
  } catch (error) {
    console.error('Error getting withdrawal history:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    const withdrawalRequest = await WithdrawalRequestModel.findById(id);
    if (!withdrawalRequest) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    if (status === "Completed") {
      withdrawalRequest.status = "Completed";
      await withdrawalRequest.save();
      const user = await UserModel.findById(withdrawalRequest.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      await WithdrawalUsdt({ req, res, userId: user._id, walletAddress: withdrawalRequest.clientAddress, amount: withdrawalRequest.amount, withdrawalRequest });

      // return res.status(200).json({ message: 'Withdrawal status updated to completed', withdrawalRequest });
    } else if (status === "Rejected") {
      withdrawalRequest.status = "Rejected";
      const user = await UserModel.findById(withdrawalRequest.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.account.currentIncome += withdrawalRequest.amount;
      await user.save();
      await withdrawalRequest.save();
      return res.status(200).json({ message: 'Withdrawal status updated to rejected' });
    } else {
      return res.status(400).json({ message: 'Invalid status' });
    }
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.AllUserIdName = async (req, res) => {
  try {
    const users = await UserModel.find().select('userId name');
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    res.status(200).json({ success: true, message: "Users data fetched successfully", data: users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getUserPurchasedMiners = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).populate({
      path: 'miners',
      populate: 'miner'
    }).select('userId name miners');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, message: "User purchased miners data fetched successfully", data: user });
  } catch (error) {
    console.error('Error getting user purchased miners:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.getUserHoldingsHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select('userId username tokenHolding');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: "User holdings history fetched successfully", data: user });
  } catch (error) {
    console.error('Error getting user holdings history:', error);
    res.status(500).json({ message: error.message });
  }
}



exports.getNebuluxData = async (req, res) => {
  try {
    const nebuluxData = await Token.findOne({});
    if (!nebuluxData) {
      return res.status(404).json({ message: 'No Nebulux data found' });
    }
    res.status(200).json({ success: true, message: "Nebulux data fetched successfully", data: nebuluxData });
  } catch (error) {
    console.error('Error getting Nebulux data:', error);
    res.status(500).json({ message: error.message });
  }
}


exports.getNebuluxPurchaseHistory = async (req, res) => {
  try {
    const purchases = await nebuluxPurchaseModel.find().populate('userId', 'email name mobile userId walletAddress').sort({ createdAt: -1 });
    if (!purchases || purchases.length === 0) {
      return res.status(400).json({ success: true, message: 'No Nebulux purchases found' });
    }
    res.status(200).json({ success: true, message: "Nebulux purchase history fetched successfully", data: purchases });
  } catch (error) {
    console.error('Error getting Nebulux purchase history:', error);
    res.status(500).json({ message: error.message });
  }
};


exports.getNebuluxPriceIncrementHistory = async (req, res) => {
  try {
    const nebuluxData = await nebuluxModel.findOne({});
    if (!nebuluxData || !nebuluxData.incrementedValue) {
      return res.status(404).json({ message: 'No Nebulux price increment history found' });
    }
    res.status(200).json({ success: true, message: "Nebulux price increment history fetched successfully", data: nebuluxData.incrementedValue });
  } catch (error) {
    console.error('Error getting Nebulux price increment history:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.createToken = async (req, res) => {
  try {
    const { quantity, price, sold = 0, tokenValue, tokenName } = req.body;

    // Basic input validation
    if (!quantity || !price || !tokeValue || !tokenName) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const newToken = new Token({
      quantity,
      price,
      sold,
      tokenValue,
      tokenName,
    });

    const savedToken = await newToken.save();

    return res.status(201).json({
      message: 'Token created successfully.',
      data: savedToken,
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return res.status(500).json({ message: 'Server error. Could not create token.' });
  }
};

exports.getAllIncomeHistory = async (req, res) => {
  try {
    const data = await incomeHistory.find();
    res.status(200).json({
      message: "Data fetched successfully",
      data,
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || error,
      success: false
    });
  }
};

exports.getTokenData = async (req, res) => {
  try {
    const token = await Token.findOne({});
    if (!token) {
      return res.status(404).json({ message: 'No tokens found.' });
    }
    return res.status(200).json({
      message: 'Token data fetched successfully.',
      data: token,
    });
  } catch (error) {
    console.error('Error fetching token data:', error);
    return res.status(500).json({ message: 'Server error. Could not fetch token data.' });
  }
}


exports.getPurchaseHistory = async(req,res)=>{
try{
let data = await investment.find()
res.status(200).json({message:"fetched",data:data})

}
catch(error){
res.status(500).json({message:"error",error})
console.error("Error in getPurchaseHistory", error)
}


}
