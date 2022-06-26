const express = require("express");
const { signup, signin, signout } = require("../controllers/user");
const {
    validateRequest,
    isRequestValidated,
    validateSigninRequest,
} = require("../validators/user");
const router = express.Router();

router.post("/signin", validateSigninRequest, isRequestValidated, signin);

router.post("/signup", validateRequest, isRequestValidated, signup);
router.post("/signout", signout);
module.exports = router;
