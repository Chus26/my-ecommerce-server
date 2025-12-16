//Get mongoose package
const mongoose = require("mongoose");

//Connect DB String
// const DB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.j4nm97a.mongodb.net/asm3?retryWrites=true&w=majority`;
const DB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.8w5r1i9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

//Connect DB func
const connectDB = async () => {
  try {
    //Connect DB with DB String
    const db = await mongoose.connect(DB_URI);

    //Return connection
    return db;
  } catch (error) {
    console.log(error);
  }
};

//Export connectDB func
module.exports = connectDB;
