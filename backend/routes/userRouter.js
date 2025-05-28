const express = require("express");
const {
    signup,
    verifyAccount,
    resendOTP,
    login,
    logout,
    forgetPassword,
    resetPassword
} = require("../controller/authController");

const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

// Route for user registration
router.post("/signup", signup);

// Route for account verification using OTP (requires user to be authenticated)
router.post("/verify", isAuthenticated, verifyAccount);

// Route to resend OTP if not yet verified (requires user to be authenticated)
router.post("/resend-otp", isAuthenticated, resendOTP);

// Route to log in the user
router.post("/login", login);

// Route to log out the user
router.post("/logout", logout);

// Route to initiate password reset by sending an OTP
router.post("/forget-password", forgetPassword);

// Route to reset password using OTP
router.post("/reset-password", resetPassword);

// Export the router
module.exports = router;
