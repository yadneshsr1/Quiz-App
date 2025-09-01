const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["academic", "student"],
    },
    // Student specific fields
    regNo: { type: String, sparse: true }, // Registration number
    course: { type: String }, // Course/Programme
    moduleCode: { type: String }, // Module Code
    photograph: { type: String }, // URL to student photo
    // Academic specific fields
    department: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
