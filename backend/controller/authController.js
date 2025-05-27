const User = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const generateOtp = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");

const signToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res, message)=>{
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",  //only secure in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
    };

    res.cookie("token", token, cookieOptions);

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

exports.signup = catchAsync(async(req, res, next) => {
    const {email, password, passwordConfirm, userName} = req.body;

    const existingUser = await User.findOne({email});

    if(existingUser)  return next(new AppError("Email already exist.", 400));

    const otp = generateOtp();

    const otpExpires = Date.now() * 24 * 60 * 60 * 1000;

    const newUser = await User.create({
        userName,
        email,
        password,
        passwordConfirm,
        otp,
        otpExpires,
    });

    
})