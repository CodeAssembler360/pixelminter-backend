const mongoose = require("mongoose");

const CidSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  nftId:{
    type:String,
    default:"",
  },
  cid: {
    type: String,
    required: true,
  },
  collectionName:{
    type:String,
    required:true
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});
let Cid = mongoose.model("cids", CidSchema);
module.exports = { Cid };
