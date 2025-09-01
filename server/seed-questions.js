const mongoose = require("mongoose");
const Question = require("./models/Question");
const setupTestQuiz = require("./setup-test-quiz");
require("dotenv").config();

async function seedQuestions() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/quiz-app"
    );
    console.log("Connected to MongoDB");

    // Create a test quiz and get its ID
    const quizId = await setupTestQuiz();
    console.log("Using quiz ID:", quizId);

    const sampleQuestions = [
      {
        quizId,
        title: "Algorithm Complexity",
        stem: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        answerKey: 1,
        points: 2,
        tags: ["algorithms", "complexity", "binary-search"],
        status: "published",
        feedback:
          "Binary search has O(log n) complexity because it divides the search space in half with each step.",
      },
      {
        quizId,
        title: "Data Structures",
        stem: "Which data structure follows LIFO principle?",
        options: ["Queue", "Stack", "LinkedList", "Array"],
        answerKey: 1,
        points: 1,
        tags: ["data-structures", "stack", "basics"],
        status: "published",
        feedback: "Stack follows Last In First Out (LIFO) principle.",
      },
      {
        quizId,
        title: "JavaScript Basics",
        stem: "What is the output of console.log(typeof null)?",
        options: ["null", "undefined", "object", "number"],
        answerKey: 2,
        points: 1,
        tags: ["javascript", "basics", "typeof"],
        status: "published",
        feedback: "In JavaScript, typeof null returns 'object', which is a known quirk of the language.",
      },
    ];

    // Clear existing questions for this quiz
    await Question.deleteMany({ quizId });

    // Insert new questions
    const questions = await Question.insertMany(sampleQuestions);
    console.log(`Created ${questions.length} sample questions`);

    console.log("Sample questions created successfully!");
    console.log("Quiz ID:", quizId);
    console.log("You can now use this ID to test the questions functionality.");

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding questions:", error);
    process.exit(1);
  }
}

seedQuestions();
