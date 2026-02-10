const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    picture: {
        type: String,
        default: null
    },
    name: { type: String, default: null },
    email: { type: String, default: null, unique: true },
    password: { type: String, default: null },
    country: { type: String, default: null },
    mobile: { type: String, default: null },
    title: { type: String, default: null },
    dob: { type: String, default: null },
    address:{type: String, default: null},
    pincode:{type: String, default: null},
    city:{type: String, default: null},
    otpDetails: {
        emailOtp: { type: String, default: null },
        emailExpireAt: { type: Date, default: null },
        isEmailVerified: { type: Boolean, default: false },
    },
    userId: { type: String, default: null, unique: true },

    walletAddress: { type: String, default: null },
    token: { type: String, default: null },
    tokenBlock: { type: Array, default: [] },
    isActive: { type: Boolean, default: false },
    activeDate: {
        type: Date,
        default: null
    },
    investment:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investment',
        default: null
    }],
    miners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mining',
        default: []
    }],

    partners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Userdetail',
        default: []
    }],
    sponsor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Userdetail',
        default: null
    },
    referralLink: { type: String, default: null },
    fund: {
        type: Number,
        default: 0.0
    },
    usdt:{
        type: Number,
        default: 0.0
    },
    transaction: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    account: {
        totalInvestment: { type: Number, default: 0.0 },
        totalEarning: { type: Number, default: 0.0 },
        totalReferralEarning: { type: Number, default: 0.0 },
        totalWithdrawal: { type: Number, default: 0.0 },
        currentIncome: { type: Number, default: 0.0 },
    },
    referralIncomes: [{
        income: { type: Number, default: 0.0 },
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'Userdetail' },
        date: { type: Date, default: Date.now }
    }],
    plan : [{
       type : mongoose.Schema.Types.ObjectId,
       ref : "Plan"
    }],
    levelPercentages: {
        type: Map,
        of: Number,
        default: { 1: 5, 2: 2, 3: 1.5, 4: 1, 5: 0.5 },
    },
    withdrawal: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Withdrawal'
    }],
    swapingHistory: [{
        swapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Swap' },
        initialAmount: { type: Number, default: 0.0 },
        currentAmount: { type: Number, default: 0.0 },
        status: { type: String, default: 'SWAP', enum: ['SWAP', 'RESWAP'] },
    }],
    tokenHolding: [{
        symbol: { type: String, default: null },
        qty: { type: Number, default: 0.0 },
        valueInUSDT: { type: Number, default: 0.0 },
    }],
    nebuluxHolding: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NebuluxPurchase'
    }],

}, { timestamps: true, versionKey: false });

// // // Exclude the password field by default when converting documents to JSON or objects
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.token; // Remove password field
        delete ret.tokenBlock; // Remove password field
        return ret;
    }
});

userSchema.set('toObject', {
    transform: (doc, ret) => {
        delete ret.token; // Remove password field
        delete ret.tokenBlock; // Remove password field
        return ret;
    }
});

userSchema.pre('save', function (next) {
    // Ensure `this` refers to the current document
    if (this.isModified('account.totalEarning') || this.isModified('account.totalWithdrawal')) {
        this.account.currentIncome = this.account.totalEarning - this.account.totalWithdrawal;
    }
    next();
});




exports.UserModel = mongoose.model('Userdetail', userSchema)