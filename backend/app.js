const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./controller/errorController");
const userRouter = require("./routes/userRouter");
const AppError = require("./utils/appError");

const app = express();

// Parse incoming JSON requests with size limit
app.use(express.json({ limit: '10kb' }));

// Parse cookies from incoming requests
app.use(cookieParser());

// Enable CORS for frontend on localhost:3000 with credentials support
app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true,
}));

// Route all user-related requests to userRouter
app.use("/api/v1/users", userRouter);

// Handle all unmatched routes with 404 error
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;