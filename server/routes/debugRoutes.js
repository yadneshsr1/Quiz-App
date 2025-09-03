const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const Quiz = require("../models/Quiz");
const Result = require("../models/Result");
const { log } = require("../utils/logger");

/**
 * Debug endpoint to show why each quiz is included/excluded for a student
 * GET /api/debug/availability?studentId=<id>
 */
router.get("/availability", auth, async (req, res) => {
  try {
    const { studentId } = req.query;
    const targetStudentId = studentId || req.user._id;
    const now = new Date();
    
    log('debug.availability.start', { 
      requestingUser: String(req.user._id), 
      targetStudent: String(targetStudentId),
      now: now.toISOString()
    });

    // Get ALL quizzes (no filters)
    const allQuizzes = await Quiz.find({}).lean();
    
    // Get all results for the target student
    const studentResults = await Result.find({ studentId: targetStudentId }).lean();
    const submittedQuizIds = new Set(studentResults.map(r => String(r.quizId)));
    
    log('debug.availability.data', {
      totalQuizzes: allQuizzes.length,
      studentResults: studentResults.length,
      submittedQuizIds: Array.from(submittedQuizIds)
    });

    const analysis = allQuizzes.map(quiz => {
      const quizId = String(quiz._id);
      
      // Check assignment
      const isPublic = !quiz.assignedStudentIds || quiz.assignedStudentIds.length === 0;
      const isAssigned = quiz.assignedStudentIds && 
        quiz.assignedStudentIds.some(id => String(id) === String(targetStudentId));
      const assignmentOk = isPublic || isAssigned;
      
      // Check time window
      const startOk = !quiz.startTime || new Date(quiz.startTime) <= now;
      const endOk = !quiz.endTime || new Date(quiz.endTime) >= now;
      const timeWindowOk = startOk && endOk;
      
      // Check submission status
      const hasSubmission = submittedQuizIds.has(quizId);
      
      // Final availability
      const isAvailable = assignmentOk && timeWindowOk && !hasSubmission;
      
      return {
        quizId,
        title: quiz.title,
        isAvailable,
        reasons: {
          assignmentOk: {
            passed: assignmentOk,
            isPublic,
            isAssigned,
            assignedCount: quiz.assignedStudentIds?.length || 0
          },
          timeWindowOk: {
            passed: timeWindowOk,
            startOk,
            endOk,
            startTime: quiz.startTime,
            endTime: quiz.endTime,
            now: now.toISOString()
          },
          submissionOk: {
            passed: !hasSubmission,
            hasSubmission,
            submissionDetails: studentResults.find(r => String(r.quizId) === quizId) || null
          }
        }
      };
    });
    
    const availableQuizzes = analysis.filter(q => q.isAvailable);
    
    log('debug.availability.result', {
      totalAnalyzed: analysis.length,
      availableCount: availableQuizzes.length,
      availableQuizIds: availableQuizzes.map(q => q.quizId)
    });
    
    res.json({
      targetStudentId: String(targetStudentId),
      timestamp: now.toISOString(),
      summary: {
        total: analysis.length,
        available: availableQuizzes.length,
        unavailable: analysis.length - availableQuizzes.length
      },
      quizzes: analysis
    });
    
  } catch (error) {
    log('debug.availability.error', { error: error.message });
    res.status(500).json({ error: "Failed to analyze availability" });
  }
});

module.exports = router;
