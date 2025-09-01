const mongoose = require("mongoose");
const Quiz = require("./models/Quiz");
require("dotenv").config();

async function setupTestQuiz() {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/quiz-app"
      );
      console.log("Connected to MongoDB");
    }

    // Create a test quiz
    const testQuiz = new Quiz({
      title: "Introduction to Computer Science",
      moduleCode: "CS101",
      description: "A basic quiz covering fundamental CS concepts",
      duration: 60, // minutes
      totalQuestions: 5,
      createdBy: null, // We'll update this after creating
    });

    // Save the quiz
    await testQuiz.save();
    console.log("Created test quiz:", testQuiz._id.toString());

    // Find academic1 user to set as creator
    const User = require("./models/User");
    const academic = await User.findOne({ username: "academic1" });

    if (academic) {
      testQuiz.createdBy = academic._id;
      await testQuiz.save();
      console.log("Updated quiz creator to:", academic.name);
    }

    console.log("\nTest quiz created successfully!");
    console.log("Quiz ID:", testQuiz._id.toString());
    console.log("You can now use this ID to add questions to the quiz.");

    // Only close connection if this script is run directly
    if (require.main === module) {
      await mongoose.connection.close();
      console.log("\nDatabase connection closed");
    }

    return testQuiz._id;
  } catch (error) {
    console.error("Error:", error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

// If this script is run directly (not imported), execute the setup
if (require.main === module) {
  setupTestQuiz();
}

module.exports = setupTestQuiz;
