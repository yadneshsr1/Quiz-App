const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const { auth } = require("../middleware/auth");

// Note: GET and POST for /quizzes/:quizId/questions are handled by quizRoutes.js
// This avoids route conflicts and keeps quiz-related operations together

// Full update (accessed via /api/questions/:id)
router.put("/:id", auth, questionController.updateQuestion);

// Quick inline updates (accessed via /api/questions/:id/inline)
router.patch("/:id/inline", auth, questionController.quickUpdate);

// Delete question (accessed via /api/questions/:id)
router.delete("/:id", auth, questionController.deleteQuestion);



module.exports = router;
