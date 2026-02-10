const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema({ 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Userdetail", required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  investmentDate: {
      type: Date,
      default: Date.now,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockinPeriod: {
      type:Date,
      default:Date.now // in days
    },
//   type: { type: String, default: "Referral Income" }, 
//   date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Investment", investmentSchema);
