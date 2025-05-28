// Utility to catch errors in async route handlers and pass them to Express error middleware
module.exports = (func) => {
  return (req, res, next) => {
    // Execute the async function and catch any errors, passing them to next()
    func(req, res, next).catch(next);
  };
};
