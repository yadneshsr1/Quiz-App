/**
 * Debug script for a specific user
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Result = require('./models/Result');
const User = require('./models/User');
const Quiz = require('./models/Quiz');

async function debugSpecificUser() {
  try {
    // Get user ID from command line argument
    const userId = process.argv[2];
    if (!userId) {
      console.log("❌ Please provide a user ID");
      console.log("Usage: node debug-specific-user.js YOUR_USER_ID");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quiz-app");
    console.log("✅ Connected to MongoDB");

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User with ID ${userId} not found`);
      return;
    }

    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`📝 Role: ${user.role}`);

    // Get all submissions by this user
    const results = await Result.find({ studentId: userId })
      .populate('quizId', 'title')
      .sort({ submittedAt: -1 });

    console.log(`\n📊 Quiz Submissions (${results.length} total):`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.quizId?.title || 'Unknown Quiz'}`);
      console.log(`   Quiz ID: ${result.quizId?._id || 'Unknown'}`);
      console.log(`   Score: ${result.score}%`);
      console.log(`   Submitted: ${result.submittedAt}`);
      console.log('');
    });

    // Show the most recent submission
    if (results.length > 0) {
      const latest = results[0];
      console.log(`🕒 Most recent submission:`);
      console.log(`   Quiz: ${latest.quizId?.title}`);
      console.log(`   Time: ${latest.submittedAt}`);
      console.log(`   Quiz ID: ${latest.quizId?._id}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

debugSpecificUser();
