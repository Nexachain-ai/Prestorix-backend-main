
const router = require('express').Router();

const UserController = require('../controllers/user.controller');
const { WalletRegister, WalletLogin } = require('../controllers/wallet.controller');
const { authenticateUser } = require('../middleware/user.middleware');
const { UserModel } = require('../models/user.model');
const planController = require("../controllers/plan.controller")
// User registration route
const { userNotverifyAccountDelete } = require('../utils/verifyAccountCalculate');
setInterval(() => {
    userNotverifyAccountDelete();
}, 1000)


// ------------------------------------ACCOUINT DETAIL START -------------------------------------
// register
router.post('/register', WalletRegister);
router.post('/register-with-email', UserController.registerWithEmailPass);
router.post('/user-otp-verify', UserController.SellerOTPVerify)
// User login
router.post('/login', WalletLogin);
router.post('/login-with-username', UserController.loginWithEmailPass);

//forget password
router.post('/forget-password', UserController.forgetPassword)
router.post('/verify-forget-otp', UserController.verifyForgetOtp)
router.post('/create-new-password', UserController.resetPassword)

//Create plan
router.post("/create-plan" ,planController.createPlan )
router.get("/get-plans" , planController.getPlans)
router.post('/fill-user-details', UserController.updateUserDetails);
router.post('/update-profile', authenticateUser, UserController.updateUserDetails);
// get logged in user
router.get('/get-user', authenticateUser, UserController.GetUser);
router.get('/get-direct-users', authenticateUser, UserController.getDirectReferrals);

router.get('/profile', authenticateUser, UserController.UserProfile);

router.get('/get-all-users', UserController.getAllUsers)
router.get('/get-user-details/:id', UserController.getUserDetails)

router.get('/get-miners', UserController.getMiners)

router.get('/get-purchased-miners', authenticateUser, UserController.getPurchasedMiners)

router.post('/deposit-amount', authenticateUser, UserController.deposit)
router.post('/purchase-miner', authenticateUser, UserController.buyOrRentMiner)
router.put('/unlock-miner', authenticateUser, UserController.unlockMiner)
router.get('/get-holdings', authenticateUser, UserController.getHoldings)

router.post('/withdraw-amount', authenticateUser, UserController.Withdrawal)
router.get('/withdrawal-history', authenticateUser, UserController.WithdrawalsHistory)
router.get('/get-swaping-data', authenticateUser, UserController.swappingData)

router.post('/swap-amount', authenticateUser, UserController.swapAmount)
router.post('/re-swap-amount', authenticateUser, UserController.reSwapAmount)
router.get('/swap-history', authenticateUser, UserController.swapHistory)
router.get('/get-miner-income-history', authenticateUser, UserController.getIncomeHistory)

router.get('/get-refer-income-history', authenticateUser, UserController.getReferralIncome)


router.get('/get-hold-token-history', authenticateUser, UserController.userTokenHoldHistory)

// new
router.get('/deposits-history',authenticateUser, UserController.DepositHistory);
router.get('/transaction-history',authenticateUser, UserController.TransactionHistory);
router.get('/get-purc')

router.post('/purchase-nebulux-coin', authenticateUser, UserController.purchaseNebuluxCoin);
router.get('/get-nebulux-purchase-data', authenticateUser, UserController.getNebuluxPurchaseData);
router.get('/get-nebulux-data', authenticateUser, UserController.getNebuluxData);

router.get('/get-myplans')



module.exports = router;