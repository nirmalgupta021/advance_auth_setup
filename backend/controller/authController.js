const User = require("../model/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");
const generateOtp = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");


// Generate JWT token with user ID
const signToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Create and send token in cookie, remove sensitive fields from response
const createSendToken = (user, statusCode, res, message)=>{
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,    // Cannot be accessed via client-side JS
        secure: process.env.NODE_ENV === "production",  //only secure in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",  // To support cross-site cookies in production
    };

    res.cookie("token", token, cookieOptions);

    // Remove sensitive data before sending user in response
    user.password = undefined;
    user.passwordConfirm = undefined;
    user.otp = undefined;

    res.status(statusCode).json({
        status: "success",
        message,
        token,
        data: {
            user,
        },
    });
};

// Handle user signup with OTP email verification
exports.signup = catchAsync(async(req, res, next) => {
    const {email, password, passwordConfirm, userName} = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({email});
    if(existingUser)  return next(new AppError("An account with this email already exists.", 400));

    // Generate OTP and expiration time
    const otp = generateOtp();
    const otpExpires = Date.now() + 24 * 60 * 60 * 1000;

    // Create new user with OTP
    const newUser = await User.create({
        userName,
        email,
        password,
        passwordConfirm,
        otp,
        otpExpires,
    });

    try {
        // Send OTP to user's email
        await sendEmail({
            email: newUser.email,
            subject: "OTP for email verification",
            html: `<h1>Your OTP is: ${otp}</h1>`
        });

        // Send response with token
        createSendToken(newUser, 200, res, "Registration successful. OTP sent to your email.");
    } catch (error) {
        // Delete user if email sending fails
        await User.findByIdAndDelete(newUser.id);
        return next(new AppError("Failed to send OTP email. Please try signing up again.", 500));
    }
});

// Handle OTP verification and account activation
exports.verifyAccount = catchAsync(async(req, res, next) => {
    const {otp} = req.body;

    // Check if OTP is provided
    if(!otp){
        return next(new AppError("OTP is required to verify your account.", 400));
    }

    const user = req.user;

    // Check if OTP matches
    if(user.otp !== otp){
        return next(new AppError("Invalid OTP. Please check and try again.", 404));
    }

    // Check if OTP is expired
    if(Date.now() > user.otpExpires){
        return next(new AppError("OTP has expired. Please request a new one."));
    }

    // Mark user as verified and remove OTP
    user.isVerified=true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save({validateBeforeSave: true});

    // Send confirmation response
    createSendToken(user, 200, res, "Your email has been successfully verified.");
});