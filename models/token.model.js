const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  supply: {
    type: Number,
    required: true,
  },
  price:{
    type: Number,
    required: true,
  },
  sold:{
    type:Number
  },
  tokenValue:{
    type: Number,
    required: true,
  },
  tokenName:{
    type: String,
    required: true,
  },
},{timestamps: true});

const Token = mongoose.model("token", tokenSchema);

module.exports = { Token };
