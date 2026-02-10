const { UserModel } = require("../models/user.model");
const { getToken } = require("../utils/getTokenGenerate");
const { getComparePassword, getHashPassword } = require("../utils/getPassword.password");
const { getOtpGenerate } = require("../utils/getOtpGenerate");
const { sendToOtp } = require("../utils/sendtootp.nodemailer");
const { uploadImageToImageKit } = require("../utils/uploadImageKit");
const {
    generateRandomReferralLink,
    generateTxnId,
} = require("../utils/generateRandomReferralLink");
const MiningModel = require("../models/mining.model");
const { MinerModel } = require("../models/miner.model");
const { TransactionModel } = require("../models/transaction.model");
const AdminModel = require("../models/admin.model");
const { WithdrawalUsdt, TransferZToken } = require("./withdrawal.controller");
const { SwapModel } = require("../models/swap.model");
const getCurrentTokenValue = require("../utils/getCurrentTokenValue");
const { calculateProfitOrLoss } = require("../utils/profitNloss");
const { EmailSendMessage, ShowMessage } = require("../utils/message.alert");
const nebuluxPurchaseModel = require("../models/nebuluxPurchase.model");
const Nebulux=require("../models/nebulux.model");
const nebuluxPriceIncrementModel = require("../models/nebuluxPriceIncrement.model");
const { WithdrawalRequestModel } = require("../models/withdrawal.model");
const { Token } = require("../models/token.model");
const planModel = require("../models/plan.model");
const InvestmentModel = require("../models/investment.model");
const investmentModel = require("../models/investment.model");
const { distributeLevelIncomeController } = require("../utils/levelIncome");

exports.registerWithEmailPass = async (req, res) => {
    try {
        const { name, email, password, mobile, referral, country } = req.body;
        if (!name || !password || !mobile || !email || !country) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser && existingUser.isActive) {
            return res.status(400).json({ success: false, message: "User already exists." });
        }

        let referralFind = referral ? await UserModel.findOne({ referralLink: referral }) : null;

        const hashedPassword = await getHashPassword(password);
        const userId = generateRandomReferralLink();
        const referralLink = userId;

        const newUser = await UserModel.create({
            name,
            email,
            password: hashedPassword,
            mobile,
            country,
            referralLink,
            userId,
            isActive: true,
            activeDate: new Date(),
            otpDetails: {
                isEmailVerified: true
            },
            sponsor: referralFind?._id
        });

        if (referralFind) {
            referralFind.partners.push(newUser._id);
            await referralFind.save();
        }

        const token = await getToken(newUser);
        newUser.token = token;
        await newUser.save();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            id: newUser._id,
            token: token
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.loginWithEmailPass = async (req, res) => {
    try {
        const { mail_id, password } = req.body;
        if (!mail_id || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        const user = await UserModel.findOne({ email: mail_id });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found." });
        }
        const isMatch = await getComparePassword(user, password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }
        const token = await getToken(user);
        user.token = token;
        await user.save();
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            success: true,
            message: ShowMessage.loginMessage,
            data: user,
            id: user._id,
            token: token,
        });
    } catch (error) {
        console.log("Error in login:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.SellerOTPVerify = async (req, res) => {
    const { email, emailOtp } = req.body;
    try {
        const User = await UserModel.findOne({ email });
        if (!User)
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials" });
        if (
            User.otpDetails.emailOtp !== emailOtp ||
            User.otpDetails.emailExpireAt < Date.now()
        )
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired OTP" });
        User.otpDetails.isEmailVerified = true;
        User.isActive = true;
        User.activeDate = new Date();
        User.otpDetails.emailOtp = null
        User.otpDetails.emailExpireAt = null;

        const token = await getToken(User)
        User.token = token
        await User.save();
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 day expiration
        });
        res.status(200).json({
            success: true,
            message: "User Account verified successfully.",
            id: User._id,
            token: token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Username is required" });
        }

        const user = await UserModel.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const emailOtp = getOtpGenerate();
        user.otpDetails.emailOtp = emailOtp.otp;
        user.otpDetails.emailExpireAt = emailOtp.expireOtp;
        await user.save();

        await sendToOtp({
            emailOtp,
            user,
            subject: "Password Reset Request",
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent to your registered email for password reset.",
            email: user.email,
            mobile: user.mobile
        });
    } catch (error) {
        console.log("Error sending email: ", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyForgetOtp = async (req, res) => {
    const { email, emailOtp } = req.body;
    try {
        const User = await UserModel.findOne({ email: email });
        if (!User)
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials" });
        if (
            User.otpDetails.emailOtp !== emailOtp ||
            User.otpDetails.emailExpireAt < Date.now()
        )
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired OTP" });
        User.otpDetails.isEmailVerified = true;
        User.isActive = true;
        User.activeDate = new Date();
        User.otpDetails.emailOtp = null
        User.otpDetails.emailExpireAt = null;

        return res.status(200).json({ success: true, message: "OTP Verified, set a new password." })
    } catch (error) {
        console.log("Error verifying otp: ", error)
        return res.status(500).json({ success: false, message: error.message });
    }
}


exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body
        // console.log(req.body)
        const user = await UserModel.findOne({email: email })
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." })
        }

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required." });
        }

        const hashedPassword = await getHashPassword(password);
        if (user.password === hashedPassword) {
            return res.status(400).json({ success: false, message: "New password cannot be the same as the old password." });
        }
        user.password = hashedPassword
        await user.save()

        res.status(200).json({ success: true, message: "Password changed successfully." })
    } catch (error) {
        // console.log("Error creating new password: ", error)
        return res.status(500).json({ success: false, message: error.message })
    }
}


exports.updateUserDetails = async (req, res) => {
    try {
        const user = req.user;
        const { username, mobile, email, profile, title, dob, address, pincode, city } = req.body;

        let url;
        if (profile) {
            url = profile.startsWith('http://') || profile.startsWith('https://')
                ? profile
                : await uploadImageToImageKit(profile, 'miners');
            if (!url) {
                return res.status(500).json({ message: 'Error uploading image' });
            }
        }
        const newUser = await UserModel.findByIdAndUpdate(
            user._id,
            { name: username, mobile, email, picture: url, title, dob, address, pincode, city },
            { new: true }
        );
        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            data: newUser,
        });
    } catch (error) {
        console.log("Error updating user details:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.GetUser = async (req, res) => {
    try {
        const user = req.user;
        const newUser = await UserModel.findById(user._id).select("name walletAddress isActive account mobile email picture referralLink sponsor activeDate userId fund createdAt tokenHolding usdt");

        let totalPreValue = 0;
        let totalCurHoldValue = 0;

        for (const item of newUser.tokenHolding) {
            const token = item.symbol;
            const qty = item.qty; // e.g. 0.02
            const preValueInUSDT = item.valueInUSDT; // directly 10 USDT, no multiply
            const currentPricePerToken = await getCurrentTokenValue(token); // e.g. 640 USDT per BNB
            const curHoldValueInUSDT = qty * currentPricePerToken; // 0.02 * 640 = 12.8 USDT

            const profitOrLoss = ((curHoldValueInUSDT - preValueInUSDT) / preValueInUSDT) * 100;

            // add to totals
            totalPreValue += preValueInUSDT;
            totalCurHoldValue += curHoldValueInUSDT;
        }

        // Now calculate total PnL
        const totalPortfolioPnLPerc = ((totalCurHoldValue - totalPreValue) / totalPreValue) * 100;
        const totalPortfolioPnL = totalCurHoldValue - totalPreValue

        newUser._doc.totalPortfolioPnLPerc = totalPortfolioPnLPerc;
        newUser._doc.totalPortfolioPnL = totalPortfolioPnL;
        // console.log(newUser);
        return res.status(200).json({
            success: true,
            message: "User fetched successfully.",
            data: newUser,
        });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
};

exports.UserProfile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id);
        res.status(200).json({
            success: true,
            message: "User Profile.",
            data: user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDirectReferrals = async (req, res) => {
    try {
        const user = req.user;
        const users = await UserModel.find({ sponsor: user._id }).select("name walletAddress isActive account mobile email picture referralLink sponsor activeDate userId createdAt");;
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
}

exports.UserLogout = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id);
        user.tokenBlock.push(user.token);
        user.token = null;
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        return res
            .status(200)
            .json({ success: true, message: "Logout successful" });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find();
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
};


exports.deposit = async (req, res) => {
    try {
        const user = req.user;
        const { amount, txResponse, recipientAddress, userAddress } = req.body;

        if (!amount) return res.status(400).json({ success: false, message: "Amount is required." });
        if (amount < 0) return res.status(400).json({ success: false, message: "Invalid amount." });

        const txnId = generateTxnId();
        const transaction = await TransactionModel.create({
            userId: user._id,
            amount: Number(amount),
            clientAddress: userAddress,
            mainAddress: recipientAddress,
            hash: txResponse.hash,
            transactionID: txnId,
            type: "deposit"
        })

        user.fund += Number(amount);
        user.transaction.push(transaction._id);
        user.walletAddress = userAddress;
        await user.save();
        return res.status(200).json({ success: true, message: "Deposit successful." });
    } catch (error) {
        console.log("Error depositing:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


exports.getMiners = async (req, res) => {
    try {
        const miners = await MinerModel.find();
        return res.status(200).json({ success: true, data: miners });
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
}

exports.buyOrRentMiner = async (req, res) => {
    try {
        const user = req.user;
        const { planId } = req.body;

        console.log("Buying or renting miner with planId:", planId, "and investment:");

        const miner = await planModel.findById(planId);

        console.log("Miner found:", miner);

        // if (investment > user.fund) return res.status(400).json({ success: false, message: "Insufficient funds in user account" });
        // if (investment < miner.min || investment > miner.max) {
        //     return res.status(400).json({ success: false, message: "Invalid investment amount" });
        // }
        if (!miner) return res.status(404).json({ success: false, message: "Plan not found" });


          const currentDate = new Date();
        const lockinPeriodDate = new Date(currentDate);
       lockinPeriodDate.setMonth(currentDate.getMonth() + Number(miner.lockin))


        const mining = await investmentModel.create({
            userId: user._id,
            plan: miner._id,
            investment: Number(miner.price),
            investmentDate: currentDate,
            lockinPeriod: lockinPeriodDate,
            isLocked: true,
        })

        console.log("Mining created:", mining);
        user.fund -= Number(miner.price);
        user.investment.push(mining._id);
        user.plan.push(planId);
        user.activeDate = new Date();
        user.isActive = true;
        user.account.totalInvestment = (user.account.totalInvestment || 0.0) + Number(miner.price);
         miner.user.push(user._id)
         await miner.save()
        await user.save();

        // const referralPercentages = user.levelPercentages;
        // let currentUser = user;
        // if (user.miners.length > 0) {
        //     console.log("Referral Income already distributed for this user.");
        // } else if (user.nebuluxHolding && user.nebuluxHolding.length > 0) {
        //     console.log("Referral Income already distributed for this user.");
        // } else {
        //     for (let level = 1; level <= Object.keys(referralPercentages).length; level++) {
        //         const sponsor = await UserModel.findById(currentUser
        //             .sponsor);
        //         console.log(sponsor)
        //         if (!sponsor) break;
        //         if (sponsor) {
        //             const referralIncome = (Number(investment) * (referralPercentages.get(level) || 0)) / 100;

        //             sponsor.account.totalReferralEarning = (sponsor.account.totalReferralEarning || 0) + referralIncome;
        //             sponsor.account.currentIncome = (sponsor.account.currentIncome || 0) + referralIncome;

        //             // Log referral income
        //             sponsor.referralIncomes.push({
        //                 income: referralIncome,
        //                 from: user._id,
        //                 date: new Date(),
        //             });
        //             await sponsor.save();
        //         }
        //         currentUser = sponsor; // Move up the referral chain
        //     }
        // }


        await distributeLevelIncomeController(user._id,planId);

        // if (miner.minerType === "buy") {
        //     return res.status(200).json({ success: true, message: "Miner bought successfully" });
        // } else {
        //     return res.status(200).json({ success: true, message: "Miner rented successfully" });
        // }

       return res.status(200).json({ success: true, message: "Miner purchased successfully", data: mining }); 
    } catch (error) {
        console.log("Error buying or renting miner:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.unlockMiner = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.body;
        const mining = await MiningModel.findById(id);
        if (!mining) return res.status(404).json({ success: false, message: "Miner not found" });

        mining.unlocked = true;
        mining.unlockedAt = new Date();
        mining.isActive = false
        await mining.save();
        user.fund = mining.investment + mining.earning;
        await user.save();

        return res.status(200).json({ success: true, message: "Miner unlocked successfully", data: mining });
    } catch (error) {
        console.log("Error unlocking miner:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


exports.getPurchasedMiners = async (req, res) => {
    try {
        const user = req.user;
        const miners = await investmentModel.find({userId:user._id}).populate("plan");
        return res.status(200).json({ success: true, data: miners });
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
}

exports.getHoldings = async (req, res) => {
    try {
        const user = req.user;
        const miners = await MiningModel.find({ _id: { $in: user.miners }, unlocked: false }).populate("miner");

        res.status(200).json({ success: true, data: miners });
    } catch (error) {
        console.log("Error fetching holdings:", error);
        return res.status(401).json({ success: false, message: error.message });
    }
}


// WITHDRAWALS
exports.Withdrawal = async (req, res) => {
    try {
        const { amount, walletAddress } = req.body;
        console.log(amount, walletAddress)

        if (!amount || !walletAddress) return res.status(400).json({ success: false, withdrawalPermission: "Rejected", message: "Amount & Wallet Address are required." });
        const user = await UserModel.findById(req.user._id).populate({ path: 'withdrawal', select: 'amount createdAt walletAddress' });
        if (!user) return res.status(404).json({ success: false, message: "User not exists." });
        if (amount > user.usdt) return res.status(400).json({ success: false, message: "Insufficient funds." });

        // if (amount < admin.min || amount > admin.max) {
        //     return res.status(400).json({ success: false, message: "Amount is outside the minimum and maximum withdrawal limit." });
        // }
        // const txnId = generateTxnId();
        // const newWithdrawal = new WithdrawalRequestModel({
        //     userId: user._id,
        //     value: amount,
        //     type: "USDT_Withdrawal",
        //     clientAddress: walletAddress,
        //     amount: amount,
        //     status: "Pending",
        //     transactionId: txnId
        // });

        // user.account.currentIncome -= amount;
        // user.withdrawal.push(newWithdrawal);
        // await user.save();
        // await newWithdrawal.save();

        // res.status(200).json({ success: true, message: "Withdrawal request created successfully.", data: newWithdrawal });

        await WithdrawalUsdt({ req, res, userId: user._id, walletAddress, amount });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.WithdrawalsHistory = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id, { withdrawal: 1, username: 1, investment: 1 }).populate({ path: 'withdrawal' });
        const history = user.withdrawal;
        const totalAmount = history.reduce((total, w) => total + w.amount, 0);
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        const todayAmount = history.filter(w => new Date(w.createdAt) >= startOfDay && new Date(w.createdAt) <= endOfDay)
            .reduce((total, w) => total + w.amount, 0);
        return res.status(200).json({ success: true, data: { history, totalAmount, todayAmount }, message: "Withdrawal finds successfully. " });
    } catch (error) {
        console.error("Error fetching total withdrawal:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// exports.swapAmount = async (req, res) => {
//     try {
//         const user = req.user;
//         const { from, to, initialValue } = req.body;

//         if (!from || !to) return res.status(400).json({ success: false, message: "Both from and to are required." });
//         if (!from.value || !to.value || from.value <= 0 || to.value < 0) return res.status(400).json({ success: false, message: "Invalid amount." });

//         user.totalFund = user.fund + (user.account?.currentIncome || 0);
//         await user.save()

//         if (from.value > user.totalFund) return res.status(400).json({ success: false, message: "Insufficient funds." });

//         const swapp = await SwapModel.create({
//             from: {
//                 value: from.value,
//                 token: from.token,
//             },
//             to: {
//                 value: to.value,
//                 token: to.token,
//             },
//             userId: user._id,
//         });

//         let remainingAmount = from.value;

//         if (user.account.currentIncome >= remainingAmount) {
//             user.account.currentIncome -= remainingAmount;
//         } else {
//             remainingAmount -= user.account.currentIncome;
//             user.account.currentIncome = 0;
//             user.fund -= remainingAmount;
//         }
//         user.swapingHistory.push({
//             swapId: swapp._id,
//             initialAmount: initialValue,
//             currentAmount: initialValue,
//         })

//         const existing = user.tokenHolding.find((token) => token.symbol === to.token);
//         if (existing) {
//             existing.qty += to.value;
//             existing.valueInUSDT += from.value
//         } else {
//             user.tokenHolding.push({ symbol: to.token, qty: to.value, valueInUSDT: from.value });
//         }

//         await user.save();

//         return res.status(200).json({ success: true, message: "Swap successful." });
//     } catch (error) {
//         console.log("Error swapping:", error);
//         return res.status(500).json({ success: false, message: error.message });
//     }
// }


exports.swapAmount = async (req, res) => {

    const user = req.user;
    const { from, to, initialValue } = req.body;

    try {   
          if (!from || !to) return res.status(400).json({ success: false, message: "Both from and to are required." });
        if (!from.value || !to.value || from.value <= 0 || to.value < 0) return res.status(400).json({ success: false, message: "Invalid amount." });

        if(to.value>user.account.currentIncome){
            return res.status(400).json({ success: false, message: `Insufficient incomes` });
        }

         const swapp = await SwapModel.create({
            from: {
                value: from.value,
                token: from.token,
            },
            to: {
                value: to.value,
                token: to.token,
            },
            userId: user._id,
        });


        user.account.currentIncome -= to.value;
        user.usdt += to.value;
        user.swapingHistory.push({
            swapId: swapp._id,
            initialAmount: initialValue,
            currentAmount: initialValue,
            status: "SWAP"
        });

         await user.save();

         return res.status(200).json({ success: true, message: "Swap successful." });

    }
    catch (error) {
        console.log("Error swapping:", error);
        return res.status(500).json({ success: false, message: error.message });
    }


}

exports.swappingData = async (req, res) => {
    try {
        const user = req.user;
        user.totalFund = user.fund + (user.account?.currentIncome || 0);
        const total = user.totalFund
        await user.save()
        const userFind = await UserModel.findById(user._id).populate({ path: 'swapingHistory.swapId' });
        const holds = userFind.swapingHistory
        // const swaps = await SwapModel.find({ userId: user._id });
        return res.status(200).json({ success: true, data: { holds, total, currentIncome: user.account?.currentIncome } });
    } catch (error) {
        console.log("❌ Error fetching data:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.swapHistory = async (req, res) => {
    try {
        const user = req.user;
        const findUser = await UserModel.findById(user._id).populate({ path: 'swapingHistory.swapId' });
        for (let i = 0; i < findUser.swapingHistory.length; i++) {
            const swap = findUser.swapingHistory[i];
            const swapData = await SwapModel.findById(swap.swapId);
            swap.currentAmount = await getCurrentTokenValue(swapData.to.token);
        }
        await findUser.save()
        const swaps = findUser.swapingHistory
        return res.status(200).json({ success: true, data: swaps });
    } catch (error) {
        console.log("❌ Error fetching data:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.getIncomeHistory = async (req, res) => {
    try {
        const user = req.user;
        const userFind = await UserModel.findById(user._id).populate({
            path: "miners",
            populate: {
                path: "miner",
                model: "Miner" // Ensure this matches the model name in MinerModel
            }
        });
        const miners = userFind.miners;

        return res.status(200).json({ status: true, data: miners });
    } catch (error) {
        console.log("❌ Error fetching data:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.getReferralIncome = async (req, res) => {
    try {
        const user = req.user

        const incomes = await UserModel.findById(user._id).populate({
            path: "referralIncomes",
            populate: "from"
        })
        return res.status(200).json({ success: true, data: incomes.referralIncomes });
    } catch (error) {
        console.log("❌ Error fetching data:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.reSwapAmount = async (req, res) => {
    try {
        const user = req.user;
        const { from, to, initialValue } = req.body;
        if (!from.value || !to.value || from.value <= 0 || to.value < 0) return res.status(400).json({ success: false, message: "Invalid amount." });

        const swapp = await SwapModel.create({
            from: {
                value: from.value,
                token: from.token,
            },
            to: {
                value: to.value,
                token: to.token,
            },
            userId: user._id,
        });

        let amount = to.value;
        user.account.currentIncome += amount;

        user.swapingHistory.push({
            swapId: swapp._id,
            initialAmount: initialValue,
            currentAmount: initialValue,
            status: "RESWAP"
        })

        const existing = user.tokenHolding.find((token) => token.symbol === from.token);
        existing.qty -= from.value;

        await user.save();

        return res.status(200).json({ success: true, message: "Re-Swap successful." });
    } catch (error) {
        console.log("Error swapping:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.userTokenHoldHistory = async (req, res) => {
    try {
        const user = req.user;
        const findUser = await UserModel.findById(user._id).populate({ path: 'swapingHistory.swapId' });
        const uniqueTokens = [];
        for (const item of findUser.tokenHolding) {
            const token = item.symbol;
            const qty = item.qty; // e.g. 0.02
            const preValueInUSDT = item.valueInUSDT; // directly 10 USDT, no multiply
            const currentPricePerToken = await getCurrentTokenValue(token); // e.g. 640 USDT per BNB
            const curHoldValueInUSDT = qty * currentPricePerToken; // 0.02 * 640 = 12.8 USDT

            const profitOrLoss = ((curHoldValueInUSDT - preValueInUSDT) / preValueInUSDT) * 100;

            uniqueTokens.push({
                symbol: token,
                holding: qty,
                preValueInUSDT,
                curHoldValueInUSDT,
                totalPnLValue: profitOrLoss,
                currentAmount: currentPricePerToken,
                tokens: findUser.tokenHolding
            });
        }
        return res.status(200).json({ success: true, message: "Swap Holding History.", data: uniqueTokens });

    } catch (err) {
        console.log("Error in getting token holdings:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
}


exports.DepositHistory = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id, {
            username: 1,
            transaction: 1, // If you're referencing transactions in user schema
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Fetch only deposits
        const deposits = await TransactionModel.find({
            userId: req.user._id,
            type: 'deposit'
        });

        const totalAmount = deposits.reduce((sum, tx) => sum + tx.amount, 0);

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const todayAmount = deposits
            .filter(tx => new Date(tx.createdAt) >= startOfDay && new Date(tx.createdAt) <= endOfDay)
            .reduce((sum, tx) => sum + tx.amount, 0);

        return res.status(200).json({
            success: true,
            data: { history: deposits, totalAmount, todayAmount },
            message: "Deposit history fetched successfully."
        });

    } catch (error) {
        console.error("Error fetching deposit history:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.TransactionHistory = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id, { username: 1 });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const transactions = await TransactionModel.find({ userId: req.user._id });

        const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const todayAmount = transactions
            .filter(tx => new Date(tx.createdAt) >= startOfDay && new Date(tx.createdAt) <= endOfDay)
            .reduce((sum, tx) => sum + tx.amount, 0);

        return res.status(200).json({
            success: true,
            data: {
                history: transactions,
                totalAmount,
                todayAmount
            },
            message: "Transaction history fetched successfully."
        });

    } catch (error) {
        console.error("Error fetching transaction history:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.purchaseNebuluxCoin = async (req, res) => {
    try {
        const user = req.user;

        const { amount, txResponse, recipientAddress, userAddress } = req.body;

        const foundUser = await UserModel.findById(user._id);
        if (!foundUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount." });
        }

        // Fetch the current price of Nebulux coin
        const nebuluxCoin = await Token.findOne({});
        if (!nebuluxCoin) {
            return res.status(404).json({ success: false, message: "Z coin not found." });
        }
        // if (amount * nebuluxCoin.price < 100) {
        //     return res.status(400).json({ success: false, message: "Minimum purchase amount is 100 USDT." });
        // }

        const nebuluxPrice = nebuluxCoin.price;

        // Create a new purchase record
        const purchase = await nebuluxPurchaseModel.create({
            userId: user._id,
            totalPrice: +(amount * nebuluxPrice).toFixed(2),
            quantity: amount
        });

        // Update supply & sold
        nebuluxCoin.supply -= amount;
        nebuluxCoin.sold += amount;
        const txnId = generateTxnId();

          const transaction = await TransactionModel.create({
            userId: user._id,
            amount: Number(amount),
            clientAddress: userAddress,
            mainAddress: recipientAddress,
            hash: txResponse.hash,
            transactionID: txnId,
            type: "deposit"
        })

        user.fund += Number(amount);
        user.transaction.push(transaction._id);

        await nebuluxCoin.save();

        user.nebuluxHolding.push(purchase._id);
        await user.save();

        await TransferZToken({ req, res, userId: user._id, walletAddress: userAddress, amount });

        // return res.status(200).json({ success: true, data: purchase });

    } catch (error) {
        console.log("Error in purchasing Nebulux coin:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.getNebuluxPurchaseData = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
            .populate('nebuluxHolding');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (user.nebuluxHolding.length === 0) {
            return res.status(200).json({ success: false, message: "Nebulux data not found." });
        }
        return res.status(200).json({ success: true, data: user.nebuluxHolding });
    } catch (error) {
        console.log("Error fetching Nebulux data:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


exports.getNebuluxData = async (req, res) => {
    try {
        const nebuluxData = await Token.findOne({});
        if (!nebuluxData) {
            return res.status(404).json({ success: false, message: "Token data not found." });
        }
        return res.status(200).json({ success: true, data: nebuluxData });
    } catch (error) {
        console.log("Error fetching Token data:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}



const RPC_URL = process.env.BSC_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;
const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;
const SYSTEM_WALLET = process.env.WALLET_ADDRESS;

exports.convertUsdtToToken = async (req, res) => {
  try {
    const { walletAddress, amountInUSDT } = req.body;

    if (!walletAddress || !amountInUSDT) {
      return res.status(400).json({ message: 'walletAddress and amountInUSDT are required.' });
    }
    

    // Setup provider and signer
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Connect to your contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

    // Assume your smart contract has a method like: transferUSDT(from, to, amount)
    const decimals = 6; // USDT usually has 6 decimals
    const amountInWei = ethers.utils.parseUnits(amountInUSDT.toString(), decimals);

    console.log(`Initiating USDT transfer of ${amountInUSDT} from ${walletAddress} to ${SYSTEM_WALLET}...`);

    const tx = await contract.transferUSDT(walletAddress, SYSTEM_WALLET, amountInWei);
    await tx.wait();

    console.log('Transfer successful:', tx.hash);

    // Update user token balance
    const TOKEN_RATE = 1;
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const tokens = amountInUSDT * TOKEN_RATE;
    user.tokenBalance = (user.tokenBalance || 0) + tokens;
    await user.save();

    return res.status(200).json({
      message: `Converted ${amountInUSDT} USDT to ${tokens} tokens`,
      txHash: tx.hash,
      tokenBalance: user.tokenBalance,
    });
  } catch (error) {
    console.error('USDT transfer error:', error);
    return res.status(500).json({ message: 'Transaction failed.' });
  }
};
