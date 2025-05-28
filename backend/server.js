const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables from config.env file
dotenv.config({ path: "./config.env" });

const db = process.env.DB;

// Connect to MongoDB database
mongoose.connect(db).then(() => {
    console.log("DB connected successfully");
}).catch((err) => {
    console.log("DB connection error:", err);
});

const port = process.env.PORT || 3000;

// Start the Express server
app.listen(port, () => {
    console.log(`App is running on port: ${port}`);
});
