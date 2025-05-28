const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "Please provide a username"],
        trim: true,
        minlength: 3,
        maxlength: 30,
        index: true,
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [function () { return this.isNew; }, "Please confirm your password"],
        validate: {
            validator: function (val) {
                return val === this.password;
            },
            message: "Passwords do not match"
        }
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpires: {
        type: Date,
        default: null,
    },
    resetPasswordOtp: {
        type: String,
        default: null,
    },
    resetPasswordOtpExpires: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;