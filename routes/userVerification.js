const express = require("express");
const { verifiedEmail, verifyEmail } = require("../controllers/user");
const router = express.Router();

router.get("/user/verify/:userId/:uniqueString", verifyEmail);
router.get("/verified", verifiedEmail);
module.exports = router;