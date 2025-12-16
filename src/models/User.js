//Get mongoose package
const mongoose = require("mongoose");

//Get Schema from mongoose
const Schema = mongoose.Schema;

//Defining userSchema
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      min: 5,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "consultant"],
      default: "user",
    },
  },
  { timestamps: true } // <-- SỬA LỖI: THÊM DÒNG NÀY
);

//Export default User Model, users collection
module.exports = mongoose.model("User", userSchema);
