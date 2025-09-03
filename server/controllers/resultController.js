const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const { log } = require("../utils/logger");

// Submit quiz results
exports.submitQuiz = async function (req, res, next) {
  try {
    const { quizId, answers, timeSpent } = req.body;
    const studentId = req.user._id;

    log('submit.in', { 
      studentId: String(studentId), 
      quizId: String(quizId), 
      answersLen: answers ? Object.keys(answers).length : 0,
      timeSpent: timeSpent || 0
    });

    // Validate required fields
    if (!quizId || !answers) {
      log('submit.validation_error', { quizId: !!quizId, answers: !!answers });
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
      log('submit.quiz_not_found', { quizId: String(quizId) });
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Get questions for this quiz from the separate Question model
    const questions = await Question.find({ 
      quizId: quizId, 
      deletedAt: null 
    }).sort({ createdAt: 1 });

    log('submit.questions', { count: questions.length });

    // Calculate score and correct answers
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    if (questions.length === 0) {
      log('submit.no_questions', { quizId: String(quizId) });
    } else {
      // Process each question
      questions.forEach((question, index) => {
        const userAnswer = answers[question._id];
        if (userAnswer !== undefined && userAnswer === question.answerKey) {
          correctAnswers++;
        }
      });
    }

    // Calculate percentage score
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    log('submit.scoring', { correctAnswers, totalQuestions, score });

    // ATOMIC UPSERT: Use findOneAndUpdate with upsert to prevent race conditions
    const resultData = {
      quizId,
      studentId,
      answers,
      score,
      correctAnswers,
      totalQuestions,
      timeSpent: timeSpent || 0,
      submittedAt: new Date()
    };

    try {
      const result = await Result.findOneAndUpdate(
        { quizId, studentId }, // filter
        { $setOnInsert: resultData }, // only set if inserting (not updating)
        { 
          upsert: true, 
          new: true, 
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      // Check if this was an insert (new submission) or existing document
      const isNewSubmission = result.submittedAt.getTime() === resultData.submittedAt.getTime();
      
      if (!isNewSubmission) {
        log('submit.duplicate', { 
          studentId: String(studentId), 
          quizId: String(quizId),
          existingSubmissionDate: result.submittedAt.toISOString()
        });
        return res.status(409).json({ 
          error: "Quiz already submitted",
          resultId: result._id,
          submittedAt: result.submittedAt
        });
      }

      log('submit.out', { 
        attemptId: String(result._id), 
        score: result.score, 
        submittedAt: result.submittedAt.toISOString()
      });

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
      
    } catch (duplicateError) {
      // Handle unique constraint violation
      if (duplicateError.code === 11000) {
        log('submit.duplicate', { 
          studentId: String(studentId), 
          quizId: String(quizId),
          error: 'unique_constraint_violation'
        });
        
        // Fetch the existing result to return consistent response
        const existingResult = await Result.findOne({ quizId, studentId });
        return res.status(409).json({ 
          error: "Quiz already submitted",
          resultId: existingResult._id,
          submittedAt: existingResult.submittedAt
        });
      }
      throw duplicateError; // Re-throw if it's not a duplicate key error
    }

  } catch (error) {
    log('submit.error', { 
      error: error.message, 
      studentId: String(req.user._id), 
      quizId: String(req.body.quizId)
    });
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
