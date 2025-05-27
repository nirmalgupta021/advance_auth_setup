const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({path:"./config.env"});

const db = process.env.DB;

//Application to database
mongoose.connect(db).then(()=>{
    console.log("DB connected successfully");
}).catch((err) => {console.log(err);});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`App is running on port: ${port}`);
});