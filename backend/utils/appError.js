// Custom error class to handle operational errors in the app
class AppError extends Error {
  constructor(message, statusCode) {
    // Call the parent class (Error) constructor with the message
    super(message);

    // Assign HTTP status code
    this.statusCode = statusCode;

    // Define status as 'fail' for 4xx errors and 'error' for 5xx
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Captures the stack trace and excludes this constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
