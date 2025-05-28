const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../model/userModel");

const isAuthenticated = catchAsync(async(req, res, next) => {
    // Extract token from cookies or Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    // If no token found, deny access
    if(!token){
        return next(new AppError("Access denied. No token provided. Please log in.", 401));
    }

    // Verify the token using JWT secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Find the user associated with the token
    const currentUser = await User.findById(decoded.id);

    // If user not found, the token is invalid
    if(!currentUser){
        return next(new AppError("Invalid token. User no longer exists.", 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
});

module.exports=isAuthenticated;