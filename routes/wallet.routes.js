const router = require('express').Router();
const WithdrawalController = require('../controllers/withdrawal.controller');

// Route to check BNB and USDT balance
router.get("/balance", WithdrawalController.BalanceCheck);
// USDT Withdrawal Route
router.post("/withdraw", WithdrawalController.WithdrawalUsdt);


module.exports = router