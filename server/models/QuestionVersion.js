const mongoose = require("mongoose");

const questionVersionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for questionId + createdAt for efficient version history queries
questionVersionSchema.index({ questionId: 1, createdAt: -1 });

const QuestionVersion = mongoose.model(
  "QuestionVersion",
  questionVersionSchema
);

module.exports = QuestionVersion;
