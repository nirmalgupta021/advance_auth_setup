const nodemailer = require("nodemailer");

// Function to send email using nodemailer
const sendEmail = async (options) => {
    // Create a transporter object using Gmail service and authentication
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail address from environment variables
            pass: process.env.EMAIL_PASS, // Your Gmail password or app-specific password
        },
    });

    // Define email options including sender, recipient, subject, and HTML content
    const mailOptions = {
        from: `"Nirmal Gupta" <nihalgupta.nirmal@gmail.com>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
