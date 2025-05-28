// Generates a random 4-digit OTP as a string
module.exports = () => {
    // Generate a number between 1000 and 9999 and convert it to string
    return Math.floor(1000 + Math.random() * 9000).toString();
}
