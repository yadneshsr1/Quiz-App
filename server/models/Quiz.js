const mongoose = require("mongoose"); // ✅ THIS LINE IS MISSING

const questionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctAnswerIndex: Number,
  feedback: String, // Added feedback field for justification/reasoning
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    moduleCode: String,
    startTime: Date,
    endTime: Date, // New field for quiz availability end time
    accessCodeHash: String, // New field for hashed access code (optional)
    allowedIpCidrs: [{ type: String }], // New field for IP filtering (optional)
    assignedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Optional student assignment
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
    questions: [questionSchema], // ✅ add this line
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
