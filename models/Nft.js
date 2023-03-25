const mongoose = require("mongoose");

const NftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  url: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    default: "",
  },
  addressDeployed: {
    type: String,
    default: "",
  },
  networkType: {
    type: String,
    default: "",
  },
  file_name: {
    type: String,
    required: true,
  },
  preview: [String],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});
let Nft = mongoose.model("nfts", NftSchema);
module.exports = { Nft };
