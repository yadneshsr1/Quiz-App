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

// Soft delete (accessed via /api/questions/:id)
router.delete("/:id", auth, questionController.softDelete);

// Restore deleted question (accessed via /api/questions/:id/restore)
router.post("/:id/restore", auth, questionController.restoreQuestion);

// Get version history (accessed via /api/questions/:id/versions)
router.get("/:id/versions", auth, questionController.getVersions);

// Restore specific version (accessed via /api/questions/:id/versions/:versionId/restore)
router.post(
  "/:id/versions/:versionId/restore",
  auth,
  questionController.restoreVersion
);

// List trash (accessed via /api/questions/trash/:quizId)
router.get("/trash/:quizId", auth, questionController.listTrash);

// Hard delete (accessed via /api/questions/:id/purge)
router.delete("/:id/purge", auth, questionController.hardDelete);

module.exports = router;
