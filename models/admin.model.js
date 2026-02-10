const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    picture: {
        type: String,
        default: null
    },
    mobile: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    otp: {
        type: String,
        default: null,
    },
    status: {
        type: Boolean,
        default: true
    },
    levelPercentages: {
        type: Map,
        of: Number,
        default: { 1: 5, 2: 2, 3: 1.5, 4: 1, 5: 0.5 },
    },
    minerEarningPercentage: {
        type: Number,
        default: 1
    },
});


adminSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.otp;
        return ret;
    }
});

adminSchema.set('toObject', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.otp;
        return ret;
    }
});

const AdminModel = mongoose.model("admin", adminSchema);

module.exports = AdminModel