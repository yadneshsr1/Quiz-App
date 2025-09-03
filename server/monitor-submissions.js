/**
 * Real-time monitoring of quiz submissions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Result = require('./models/Result');

async function monitorSubmissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quiz-app");
    console.log("✅ Connected to MongoDB - Monitoring submissions...");
    console.log("📡 Watching for new quiz submissions (Press Ctrl+C to stop)\n");

    // Watch for changes in the Result collection
    const changeStream = Result.watch();
    
    changeStream.on('change', async (change) => {
      if (change.operationType === 'insert') {
        const newResult = change.fullDocument;
        console.log(`🎯 NEW SUBMISSION DETECTED!`);
        console.log(`   Student ID: ${newResult.studentId}`);
        console.log(`   Quiz ID: ${newResult.quizId}`);
        console.log(`   Score: ${newResult.score}%`);
        console.log(`   Time: ${newResult.submittedAt}`);
        console.log(`   Result ID: ${newResult._id}`);
        console.log('---');
      }
    });

    // Keep the script running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping monitoring...');
      await changeStream.close();
      await mongoose.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

monitorSubmissions();
