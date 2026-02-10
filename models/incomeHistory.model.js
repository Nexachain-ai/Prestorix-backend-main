const mongoose = require("mongoose");

const incomeHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Userdetail", required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "Userdetail", required: true },
  level: { type: Number, required: true },
  amount: { type: Number, required: true },
  type: { type: String, default: "Referral Income" }, 
  date: { type: Date, default: Date.now },
  percent : {type : Number , default : 0}
});

module.exports = mongoose.model("IncomeHistory", incomeHistorySchema);
