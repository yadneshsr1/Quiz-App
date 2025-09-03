const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const requireLaunchTicket = require("../middleware/requireLaunchTicket");
const quizController = require("../controllers/quizController"); // ✅ fixed path

// Create new quiz
router.post("/", auth, quizController.createQuiz);

// Get all quizzes
router.get("/", quizController.getQuizzes);

// Get eligible quizzes (for students - time window filtered)
router.get("/eligible", auth, quizController.getEligibleQuizzes);

// Get completed quizzes (for students)
router.get("/completed", auth, quizController.getCompletedQuizzes);



// Launch quiz with access code (for students)
router.post("/:quizId/launch", auth, quizController.launchQuiz);

// Start quiz with launch ticket (for students)
router.get("/:quizId/start", auth, requireLaunchTicket, quizController.startQuiz);

// Get specific quiz by ID (with authentication for access control)
router.get("/:id", auth, quizController.getQuiz);

// Get questions for a specific quiz
router.get("/:id/questions", auth, quizController.getQuizQuestions);

// Add question to quiz
router.post("/:id/questions", auth, quizController.addQuestion);

// Update quiz
router.put("/:id", auth, quizController.updateQuiz);

// Delete quiz
router.delete("/:id", auth, quizController.deleteQuiz);

module.exports = router;
