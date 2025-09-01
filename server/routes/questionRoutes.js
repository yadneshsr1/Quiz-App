const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const { auth } = require("../middleware/auth");

// List questions with filters/search
router.get("/quizzes/:quizId/questions", questionController.listQuestions);

// Create new question
router.post(
  "/quizzes/:quizId/questions",
  auth,
  questionController.createQuestion
);

// Full update (with version tracking)
router.put("/questions/:id", auth, questionController.updateQuestion);

// Quick inline updates
router.patch("/questions/:id/inline", auth, questionController.quickUpdate);

// Soft delete
router.delete("/questions/:id", auth, questionController.softDelete);

// Restore deleted question
router.post("/questions/:id/restore", auth, questionController.restoreQuestion);

// Get version history
router.get("/questions/:id/versions", auth, questionController.getVersions);

// Restore specific version
router.post(
  "/questions/:id/versions/:versionId/restore",
  auth,
  questionController.restoreVersion
);

// List trash
router.get("/trash/:quizId", auth, questionController.listTrash);

// Hard delete (purges)
router.delete("/questions/:id/purge", auth, questionController.hardDelete);

module.exports = router;
