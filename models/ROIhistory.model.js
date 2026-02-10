const mongoose = require('mongoose');

const dailyIncomeHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Userdetail', 
    required: true,
  },
  date: {
    
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('ROIhistory', dailyIncomeHistorySchema);
