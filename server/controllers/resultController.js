const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

// Submit quiz results
exports.submitQuiz = async function (req, res, next) {
  try {
    const { quizId, answers, timeSpent } = req.body;

    // Validate required fields
    if (!quizId || !answers) {
      return res.status(400).json({
        error: "Missing required fields",
        required: {
          quizId: !!quizId,
          answers: !!answers,
        },
      });
    }

    // Get quiz to check if it exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Get questions for this quiz from the separate Question model
    const questions = await Question.find({ 
      quizId: quizId, 
      deletedAt: null 
    }).sort({ createdAt: 1 });

    if (questions.length === 0) {
      return res.status(400).json({ error: "No questions found for this quiz" });
    }

    console.log(`Processing ${questions.length} questions for quiz ${quizId}`);

    // Calculate score and correct answers
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    // Process each question
    questions.forEach((question, index) => {
      const userAnswer = answers[question._id];
      if (userAnswer !== undefined && userAnswer === question.answerKey) {
        correctAnswers++;
      }
    });

    // Calculate percentage score
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    console.log(`Quiz submission: ${correctAnswers}/${totalQuestions} correct (${score}%)`);

    // Check if student has already submitted this quiz
    const existingResult = await Result.findOne({ 
      quizId: quizId, 
      studentId: req.user._id 
    });

    if (existingResult) {
      return res.status(409).json({ 
        error: "Quiz already submitted",
        resultId: existingResult._id
      });
    }

    // Create the result
    const result = new Result({
      quizId,
      studentId: req.user._id, // Use studentId instead of userId
      answers,
      score,
      correctAnswers, // Add the missing field
      totalQuestions,
      timeSpent: timeSpent || 0, // Ensure timeSpent is not null
    });

    await result.save();
    
    console.log(`Result saved successfully: ${result._id}`);

    // Return the result with additional info for the client
    const resultResponse = {
      _id: result._id,
      quizId: result.quizId,
      score: result.score,
      correctAnswers: result.correctAnswers,
      totalQuestions: result.totalQuestions,
      timeSpent: result.timeSpent,
      submittedAt: result.submittedAt,
      answers: result.answers
    };

    res.status(201).json({ result: resultResponse });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};

// Get a specific result
exports.getResult = async function (req, res, next) {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Failed to fetch result" });
  }
};

// Update a result
exports.updateResult = function (req, res, next) {
  Result.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedResult) => {
      if (!updatedResult)
        return res.status(404).json({ error: "Result not found" });
      res.json(updatedResult);
    })
    .catch((error) => {
      console.error("Error updating result:", error);
      res.status(400).json({ error: "Failed to update result" });
    });
};

// Delete a result
exports.deleteResult = function (req, res, next) {
  Result.findByIdAndDelete(req.params.id)
    .then((deletedResult) => {
      if (!deletedResult)
        return res.status(404).json({ error: "Result not found" });
      res.json({ message: "Result deleted successfully" });
    })
    .catch((error) => {
      console.error("Error deleting result:", error);
      res.status(400).json({ error: "Failed to delete result" });
    });
};
