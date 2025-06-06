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

// Handle resend OTP
exports.resendOTP = catchAsync(async(req, res, next) => {
    const {email} = req.user;

    // Check if email is provided
    if (!email) {
        return next(new AppError("Please provide an email address.", 400));
    }

    // Find the user with the given email
    const user = await User.findOne({ email });

    // If no user is found
    if (!user) {
        return next(new AppError("No account found with this email address.", 404));
    }

    // If user is already verified
    if (user.isVerified) {
        return next(new AppError("This account is already verified. No need to resend OTP.", 400));
    }

    // Generate new OTP and set expiration
    const newOtp = generateOtp();
    user.otp = newOtp;
    user.otpExpires = Date.now() + 24 * 60 * 60 * 1000; // OTP valid for 24 hours

    // Save user without running validation checks
    await user.save({ validateBeforeSave: false });

    try {
        // Send OTP to user's email
        await sendEmail({
            email: user.email,
            subject: "Resend OTP for Email Verification",
            html: `<h1>Your new OTP is ${newOtp}</h1>`
        });

        // Respond with success
        res.status(200).json({
            status: "success",
            message: "A new OTP has been sent to your email address.",
        });
    } catch (error) {
        // If sending email fails, clear OTP fields and notify the user
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError("Failed to send OTP email. Please try again later.", 500));
    }
});

//Handle user login
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return next(new AppError("Email and password are required to log in.", 400));
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Invalid email or password. Please try again.", 401));
    }

    // Send JWT token upon successful login
    createSendToken(user, 200, res, "Logged in successfully.");
});

//Handle user logout
exports.logout = catchAsync(async (req, res, next) => {
    // Clear the token cookie by setting it to a short-lived value
    res.cookie("token", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });

    // Send logout confirmation response
    res.status(200).json({
        status: "success",
        message: "You have been logged out successfully.",
    });
});

// Handle forgot password
exports.forgetPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // Check if user exists with provided email
    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError("No account found with this email address.", 404));
    }

    // Generate OTP and set expiry time (5 minutes)
    const otp = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 300000;

    // Save user without running validations
    await user.save({ validateBeforeSave: false });

    try {
        // Send OTP via email
        await sendEmail({
            email: user.email,
            subject: "Password Reset OTP (valid for 5 minutes)",
            html: `<h1>Your password reset OTP is: ${otp}</h1>`,
        });

        res.status(200).json({
            status: "success",
            message: "A password reset OTP has been sent to your email.",
        });
    } catch (error) {
        // Cleanup OTP fields if email sending fails
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError("Failed to send reset OTP email. Please try again later.", 500));
    }
});

// Handle reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { email, otp, password, passwordConfirm } = req.body;

    // Find the user with matching email, OTP, and unexpired OTP
    const user = await User.findOne({
        email,
        resetPasswordOtp: otp,
        resetPasswordOtpExpires: { $gt: Date.now() },
    });

    // If user not found or OTP is invalid/expired
    if (!user) {
        return next(new AppError("Invalid or expired OTP, or user not found.", 400));
    }

    // Set the new password and clear OTP fields
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    // Save the updated user document
    await user.save();

    // Log the user in by sending a token
    createSendToken(user, 200, res, "Your password has been reset successfully.");
});