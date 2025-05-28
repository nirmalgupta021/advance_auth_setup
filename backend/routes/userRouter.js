const express = require("express");
const { signup, verifyAccount } = require("../controller/authController");
const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify", isAuthenticated, verifyAccount);

module.exports = router;