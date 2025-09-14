const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    stem: {
      type: String,
      required: false,
    },
    options: [
      {
        type: String,
        required: true,
      },
    ],
    answerKey: {
      type: Number,
      required: true,
      min: 0,
    },
    points: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for efficient quiz filtering
questionSchema.index({ quizId: 1 });

// Add text index for search functionality
questionSchema.index({ title: "text" });

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;