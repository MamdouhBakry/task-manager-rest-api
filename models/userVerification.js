const mongoose = require("mongoose");
const userVerificationSchema = new mongoose.Schema(
    {
        userId: String,
        uniqueString: String,
        createdAt: Date,
        expireAt: Date
    }
);

module.exports = mongoose.model("UserVerification", userVerificationSchema);
