// this is admin routes file
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const planController = require("../controllers/plan.controller")
const levelIncome = require("../utils/levelIncome")
const checkAdminLoggedIn = require('../middleware/admin.middleware');
const { MinerModel } = require('../models/miner.model');

require("../utils/adminRegister").adminRegister()

// Admin management
router.post('/login', adminController.loginAdmin);
router.post('/create-admin', adminController.createAdmin);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password', adminController.resetPassword);
router.get('/logout', adminController.logoutAdmin);

// Apply authentication middleware to routes that require authentication
router.use(checkAdminLoggedIn);

router.get('/get-admin', checkAdminLoggedIn, adminController.getAdmin);
router.get('/get-dashboard-data', checkAdminLoggedIn, adminController.getDashboardData);
router.get('/get-miners', checkAdminLoggedIn, adminController.getMiners);
router.get('/create-miner', checkAdminLoggedIn, adminController.createOrUpdateMiner);
router.put('/update-miner/:id', checkAdminLoggedIn, adminController.createOrUpdateMiner);
router.get('/get-purchased-miners-history', checkAdminLoggedIn, adminController.getPurchasedMinersHistory);

router.put('/update-referral-percentages', checkAdminLoggedIn, adminController.updateReferralPercentages);



router.get("/get-roi-history" , planController.getROIhistory)
router.get("/get-income-history" , adminController.getAllIncomeHistory)



router.get('/get-all-users', checkAdminLoggedIn, adminController.getAllUsers);
router.get('/get-user-details/:id', checkAdminLoggedIn, adminController.getUserDetails);
router.put('/block-unblock-user/:id', checkAdminLoggedIn, adminController.blockUnblockuser)


// referral income history
router.get('/get-referral-income-history', checkAdminLoggedIn, adminController.getReferralIncomeHistory);
// miner income history
router.get('/get-miner-income-history', checkAdminLoggedIn, adminController.getMinerIncomeHistory);
// // deposite fund history
router.get('/get-fund-deposit-history', checkAdminLoggedIn, adminController.getDepositHistory);
// // withdrawal history
router.get('/get-withdrawal-history', checkAdminLoggedIn, adminController.getWithdrawalHistory);

router.post('/update-withdrawal-status/:id', checkAdminLoggedIn, adminController.updateWithdrawalStatus);

// // swap history
// router.get('/get-swap-history', checkAdminLoggedIn, adminController.getSwapHistory);
// // holding history
// router.get('/get-holding-history', checkAdminLoggedIn, adminController.getHoldingHistory);


router.get('/all-user-id-name', checkAdminLoggedIn, adminController.AllUserIdName);
router.get('/get-user-purchased-miner/:id', checkAdminLoggedIn, adminController.getUserPurchasedMiners);
router.get('/get-user-holdings-trading/:id', checkAdminLoggedIn, adminController.getUserHoldingsHistory);


router.get('/get-nebulux-data', checkAdminLoggedIn, adminController.getNebuluxData);
router.get('/get-nebulux-purchase-history', checkAdminLoggedIn, adminController.getNebuluxPurchaseHistory);
router.get('/get-nebulux-price-increment-history', checkAdminLoggedIn, adminController.getNebuluxPriceIncrementHistory);
router.post("/create-Token", checkAdminLoggedIn, adminController.createToken);
router.post("/get-Token-data", checkAdminLoggedIn, adminController.getTokenData);
router.get("/get-purchase-history", checkAdminLoggedIn, adminController.getPurchaseHistory);

// const minersCreate = [
//     {
//         "minerType": "default",
//         "minerName": "SmartPhone Miner",
//         "investment": "$0",
//         "dailyEarning": "$0.1-$10",
//         "description": "Reliable and efficient miner for professional setups.",
//         "image": "https://ik.imagekit.io/anubhavmaithil24/qMiner-miner/product2.png?updatedAt=1742904373651",
//         "isActive": false
//     },
//     {
//         "minerType": "rent",
//         "minerName": "Rent Miner",
//         "investment": "$100-$100M",
//         "dailyEarning": "$0.8-$1000",
//         "description": "High-efficiency Bitcoin mining machine with low power consumption.",
//         "image": "https://ik.imagekit.io/anubhavmaithil24/qMiner-miner/product1.png?updatedAt=1742904373727",
//         "isActive": true
//     },
//     {
//         "minerType": "buy",
//         "minerName": "Buy Miner",
//         "investment": "$100k-$100M",
//         "dailyEarning": "$0.8-$1000",
//         "description": "Powerful mining rig suitable for long-term profitability.",
//         "image": "https://ik.imagekit.io/anubhavmaithil24/qMiner-miner/product1.png?updatedAt=1742904373727",
//         "isActive": true
//     }
// ]
// router.get('/hello', checkAdminLoggedIn, async (req, res) => {
//     try {
//         const miners = await MinerModel.insertMany(minersCreate);

//         return res.status(200).json({ success: true, miners });
//     } catch (error) {
//         console.log("Error", error)
//         return res.status(401).json({ success: false, message: error.message });
//     }
// })

module.exports = router;