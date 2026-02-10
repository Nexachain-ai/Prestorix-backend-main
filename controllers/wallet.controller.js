const { UserModel } = require('../models/user.model');
const { generateRandomReferralLink, generateUserId } = require('../utils/generateRandomReferralLink');
const { getToken } = require('../utils/getTokenGenerate');

exports.WalletRegister = async (req, res) => {
    const { walletAddress, referral, } = req.body;
    if (!walletAddress) return res.status(500).json({ success: false, message: "Wallet Address is required." })
    try {
        let user = await UserModel.findOne({ walletAddress });
        const newReferralLink = generateRandomReferralLink();
        const name = newReferralLink

        const id = generateUserId();

        if (user) return res.status(500).json({ success: false, message: "Wallet Address already exists." });

        const allUsers = await UserModel.countDocuments()
        if (allUsers == 0) {
            const newUser = new UserModel({ walletAddress, referralLink: newReferralLink, name, userId: id });
            await newUser.save();
            const token = await getToken(newUser);
            newUser.token = token;
            newUser.isVerified = true;
            await newUser.save();
            res.cookie('zcoin-client', token, { httpOnly: false, secure: true, sameSite: 'Strict', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 });
            return res.json({ success: true, message: "Register successfully.", token, id: newUser._id });
        }

        const sponsor = await UserModel.findOne({ referralLink: referral });
        if (!sponsor) return res.status(500).json({ success: false, message: "Invalid Referral Id." });

        const newUser = new UserModel({ walletAddress, sponsor: sponsor._id, referralLink: newReferralLink, name, userId: id });
        await newUser.save();
        sponsor.partners.push(newUser._id);
        const token = await getToken(newUser);
        newUser.token = token,
            newUser.isVerified = true;

        await newUser.save();
        await sponsor.save();

        res.cookie('zcoin-client', token, { httpOnly: false, secure: true, sameSite: 'Strict', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 });
        return res.json({ success: true, message: "Register successfully.", token, id: newUser._id });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.WalletLogin = async (req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(500).json({ success: false, message: "Wallet Address is required." })
    try {
        let user = await UserModel.findOne({ walletAddress });
        if (!user) return res.status(500).json({ success: false, message: "Wallet Address not exists." });
        const token = await getToken(user)
        user.token = token
        await user.save();
        
        res.cookie('zcoin-client', token, { httpOnly: false, secure: true, sameSite: 'Strict', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 });
        return res.status(200).json({ success: true, message: "login successfully.", token, id: user._id });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
}

