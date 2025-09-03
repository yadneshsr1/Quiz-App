const express = require("express");
const router = express.Router();
const { auth, requireRole } = require("../middleware/auth");
const resultController = require("../controllers/resultController");

// Submit quiz results
router.post("/submit", auth, resultController.submitQuiz);

// Get specific result
router.get("/:id", auth, resultController.getResult);

// Get student's results for a specific quiz
router.get(
  "/quiz/:quizId",
  auth,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { quizId } = req.params;
      const studentId = req.user._id;

      const Result = require("../models/Result");
      const result = await Result.findOne({ quizId, studentId }).populate(
        "quizId",
        "title moduleCode questions"
      );

      if (!result) {
        return res.status(404).json({ error: "Result not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching result:", error);
      res.status(500).json({ error: "Failed to fetch result" });
    }
  }
);

// Get all results for a student
router.get("/student", auth, requireRole(["student"]), async (req, res) => {
  try {
    const Result = require("../models/Result");
    const studentId = req.user._id;

    const results = await Result.find({ studentId })
      .populate("quizId", "title moduleCode")
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    console.error("Error fetching student results:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Get all results for a quiz (academic view)
router.get(
  "/quiz/:quizId/all",
  auth,
  requireRole(["academic"]),
  async (req, res) => {
    try {
      const { quizId } = req.params;
      const Result = require("../models/Result");
      const Quiz = require("../models/Quiz");
      const mongoose = require("mongoose");

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const quizObjectId = new mongoose.Types.ObjectId(quizId);
      const results = await Result.find({ quizId: quizObjectId })
        .populate({
          path: "studentId",
          select: "name regNo course",
          model: "User",
        })
        .populate("quizId", "title moduleCode")
        .sort({ submittedAt: -1 })
        .lean();

      res.json(results);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ error: "Failed to fetch quiz results" });
    }
  }
);

// Get anonymous analytics for a quiz (academic view)
router.get(
  "/quiz/:quizId/analytics",
  auth,
  requireRole(["academic"]),
  async (req, res) => {
    try {
      const { quizId } = req.params;
      const Result = require("../models/Result");
      const Quiz = require("../models/Quiz");
      const Question = require("../models/Question");
      const mongoose = require("mongoose");

      // Get quiz details
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Get questions for this quiz
      const questions = await Question.find({ 
        quizId: quizId, 
        deletedAt: null 
      }).sort({ createdAt: 1 });

      // Get all results for this quiz
      const quizObjectId = new mongoose.Types.ObjectId(quizId);
      const results = await Result.find({ quizId: quizObjectId })
        .sort({ submittedAt: -1 })
        .lean();

      console.log(`Analytics: Found ${results.length} results for quiz ${quizId}`);
      if (results.length > 0) {
        console.log("Sample result structure:", {
          _id: results[0]._id,
          answers: results[0].answers,
          answersType: typeof results[0].answers,
          answersKeys: Object.keys(results[0].answers || {})
        });
      }

      // Calculate analytics
      const totalSubmissions = results.length;
      const averageScore = totalSubmissions > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalSubmissions)
        : 0;
      
      const passedCount = results.filter(r => r.score >= 60).length;
      const failedCount = totalSubmissions - passedCount;

      // Question-wise analytics
      const questionAnalytics = questions.map((question, index) => {
        const correctCount = results.filter(result => {
          const userAnswer = result.answers[question._id.toString()];
          return userAnswer === question.answerKey;
        }).length;

        const totalAnswered = results.filter(result => {
          return result.answers.hasOwnProperty(question._id.toString());
        }).length;

        console.log(`Question ${index + 1} analytics:`, {
          questionId: question._id.toString(),
          correctCount,
          totalAnswered,
          answerKey: question.answerKey
        });

        return {
          questionId: question._id,
          questionText: question.title,
          options: question.options,
          correctAnswerIndex: question.answerKey,
          correctCount,
          totalAnswered,
          accuracy: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
        };
      });

      // Anonymous results (without student details)
      const anonymousResults = results.map((result, index) => ({
        _id: result._id,
        studentId: {
          _id: `anon_${index + 1}`,
          name: `Anonymous Student ${index + 1}`,
          regNo: `ANON${String(index + 1).padStart(3, '0')}`,
          course: "Anonymous"
        },
        score: result.score,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeSpent: result.timeSpent,
        submittedAt: result.submittedAt,
        status: result.score >= 60 ? "passed" : "failed",
        answers: result.answers // Already a regular object from .lean()
      }));

      const analytics = {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          moduleCode: quiz.moduleCode,
          totalQuestions: questions.length,
          duration: quiz.duration
        },
        summary: {
          totalSubmissions,
          averageScore,
          passedCount,
          failedCount,
          passRate: totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0
        },
        questionAnalytics,
        results: anonymousResults
      };

      console.log("Analytics response summary:", {
        quizTitle: analytics.quiz.title,
        totalSubmissions: analytics.summary.totalSubmissions,
        questionCount: analytics.questionAnalytics.length,
        resultsCount: analytics.results.length
      });

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      res.status(500).json({ error: "Failed to fetch quiz analytics" });
    }
  }
);

module.exports = router;
