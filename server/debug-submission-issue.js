/**
 * Debug script to check quiz submission and availability issues
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Quiz = require('./models/Quiz');
const Result = require('./models/Result');
const User = require('./models/User');

async function debugSubmissionIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quiz-app");
    console.log("✅ Connected to MongoDB");

    // Get a sample student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log("❌ No students found in database");
      return;
    }
    console.log(`📚 Testing with student: ${student.name} (${student._id})`);

    // Get available quizzes using the same logic as the API
    const now = new Date();
    const availableQuizzes = await Quiz.find({
      $and: [
        { startTime: { $lte: now } },
        {
          $or: [
            { endTime: null },
            { endTime: { $gte: now } }
          ]
        },
        {
          $or: [
            { assignedStudentIds: { $exists: false } },
            { assignedStudentIds: { $size: 0 } },
            { assignedStudentIds: student._id }
          ]
        }
      ]
    });

    console.log(`📝 Found ${availableQuizzes.length} time-eligible quizzes`);

    // Get attempted quiz IDs
    const attemptedQuizIds = await Result.find({ studentId: student._id })
      .select('quizId')
      .distinct('quizId');

    console.log(`🎯 Student has attempted ${attemptedQuizIds.length} quizzes:`);
    attemptedQuizIds.forEach(id => console.log(`   - ${id}`));

    // Filter out attempted quizzes
    const finalAvailableQuizzes = availableQuizzes.filter(quiz => 
      !attemptedQuizIds.some(attemptedId => 
        attemptedId.toString() === quiz._id.toString()
      )
    );

    console.log(`✅ Final available quizzes: ${finalAvailableQuizzes.length}`);
    finalAvailableQuizzes.forEach(quiz => console.log(`   - ${quiz.title} (${quiz._id})`));

    // Check for any issues with the filtering logic
    if (availableQuizzes.length > 0 && finalAvailableQuizzes.length === availableQuizzes.length) {
      console.log("⚠️  WARNING: No quizzes were filtered out - student may not have submitted any quizzes yet");
    }

    // Show all results for this student
    const allResults = await Result.find({ studentId: student._id }).populate('quizId', 'title');
    console.log(`📊 All submissions by ${student.name}:`);
    allResults.forEach(result => {
      console.log(`   - ${result.quizId?.title || 'Unknown Quiz'} (${result.quizId?._id || 'Unknown ID'}) - Score: ${result.score}% - Submitted: ${result.submittedAt}`);
    });

  } catch (error) {
    console.error("❌ Debug error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
}

debugSubmissionIssue();
