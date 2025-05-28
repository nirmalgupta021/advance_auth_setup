const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

// Define the schema for the User model
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "Username is required."],
        trim: true,
        minlength: 3,
        maxlength: 30,
        index: true, // Optimizes queries using userName
    },
    email: {
        type: String,
        required: [true, "Email address is required."],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email address."],
    },
    password: {
        type: String,
        required: [true, "Password is required."],
        minlength: 8,
        select: false, // Exclude password field from query results by default
    },
    passwordConfirm: {
        type: String,
        required: [function () { return this.isNew; }, "Password confirmation is required."],
        validate: {
            // Ensures password and passwordConfirm match
            validator: function (val) {
                return val === this.password;
            },
            message: "Passwords must match."
        }
    },
    isVerified: {
        type: Boolean,
        default: false, // Used for email verification
    },
    otp: {
        type: String,
        default: null, // OTP for email verification
    },
    otpExpires: {
        type: Date,
        default: null, // Expiration time for the verification OTP
    },
    resetPasswordOtp: {
        type: String,
        default: null, // OTP for resetting password
    },
    resetPasswordOtpExpires: {
        type: Date,
        default: null, // Expiration time for password reset OTP
    },
    createdAt: {
        type: Date,
        default: Date.now, // Record creation time
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// Middleware: Hash the password before saving if it's modified
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    // Hash the password using bcrypt
    this.password = await bcrypt.hash(this.password, 12);

    // Remove passwordConfirm before saving to DB
    this.passwordConfirm = undefined;
    next();
});

// Instance method to compare input password with the hashed password in DB
userSchema.methods.correctPassword = async function (password, userPassword) {
    return await bcrypt.compare(password, userPassword);
};

// Create and export the User model
const User = mongoose.model("User", userSchema);
module.exports = User;
