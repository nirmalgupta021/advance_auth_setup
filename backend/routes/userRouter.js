const express = require("express");
const { signup, verifyAccount, resendOTP } = require("../controller/authController");
const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify", isAuthenticated, verifyAccount);
router.post("/resend-otp", isAuthenticated, resendOTP);

module.exports = router;