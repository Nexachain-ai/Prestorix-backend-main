const mongoose = require("mongoose")

const planSchema = new mongoose.Schema({
     name: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    monthlyROIpercentage : {
      type: Number,
      required: true,
    },
    totalROIpercentage : {
      type : Number,
      default : 0
    },
    lockin :{
      type :Number,
      default : 0
    },
    user : [{
      type : mongoose.Schema.Types.ObjectId,
      ref: "Userdetail"
    }]
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Plan" , planSchema)

