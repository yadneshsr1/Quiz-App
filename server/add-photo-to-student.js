const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function addPhotoToStudent() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/quiz-app");
    const student = await User.findOne({ username: "student1" });
    if (student) {
      // Use a more reliable placeholder service or local fallback
      student.photograph = "https://picsum.photos/150/200?random=1";
      await student.save();
      console.log("✅ Added photo URL to student1");
    } else {
      console.log("❌ Student1 not found");
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

addPhotoToStudent();
