const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  signature: {
    type: String,
    required: false,
  },
  collection_payment: {
    type: Boolean,
    default: false,
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
let User = mongoose.model("user", UserSchema);
module.exports = { User };
