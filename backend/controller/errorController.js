module.exports = (err, req, res, next) => {
    // Set default status code and status if not provided
    err.statusCode = err.statusCode || 500; // Internal Server Error by default
    err.status = err.status || "error";

    // Send error response
    res.status(err.statusCode).json({
        status: err.status, // 'fail' or 'error'
        error: err, // full error object (for debugging)
        message: err.message || "An unexpected error occurred.", // user-friendly error message
        stack: err.stack, // stack trace (useful during development)
    });
};
