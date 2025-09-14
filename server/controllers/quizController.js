const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Result = require("../models/Result");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isIpAllowed, validateAndNormalizeCidr } = require("../utils/ipcheck");
const os = require('os');
const { markTicketAsUsed, isTicketUsed } = require("../utils/ticketManager");

function getLocalIPv4Address() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const netIf of interfaces[name]) {
      if (netIf.family === 'IPv4' && !netIf.internal) {
        return netIf.address;
      }
    }
  }
  return '127.0.0.1';
}
const { logSecurityEvent } = require("../utils/securityLogger");
const { log } = require("../utils/logger");

// Configuration constants
const CLOCK_SKEW_TOLERANCE_MS = parseInt(process.env.CLOCK_SKEW_TOLERANCE_MS) || 60000; // 60 seconds default
const LAUNCH_TICKET_TTL_MIN = parseInt(process.env.LAUNCH_TICKET_TTL_MIN) || 10; // 10 minutes default
const ENABLE_SINGLE_USE_TICKETS = process.env.ENABLE_SINGLE_USE_TICKETS === 'true'; // Optional feature

// In-memory storage for used ticket IDs (in production, use Redis or database)
const usedTicketIds = new Map();

// Clean up expired ticket IDs periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [jti, expiryTime] of usedTicketIds.entries()) {
    if (now > expiryTime) {
      usedTicketIds.delete(jti);
    }
  }
}, 5 * 60 * 1000);

// Utility function to check if a quiz is currently open with clock skew tolerance
function isQuizOpen(quiz, now = new Date()) {
  const toleranceMs = CLOCK_SKEW_TOLERANCE_MS;
  
  // Quiz must have started (with tolerance)
  if (quiz.startTime) {
    const startTime = new Date(quiz.startTime);
    if (startTime.getTime() > now.getTime() + toleranceMs) {
      return false;
    }
  }
  
  // Quiz must not have ended (with tolerance)
  if (quiz.endTime) {
    const endTime = new Date(quiz.endTime);
    if (endTime.getTime() <= now.getTime() - toleranceMs) {
      return false;
    }
  }
  
  return true;
}

// Utility function to sign launch tickets with configurable TTL
function signLaunchTicket(userId, quizId) {
  const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || "quiz-launch-secret-dev-only";
  const ttlSeconds = LAUNCH_TICKET_TTL_MIN * 60;
  
  const payload = {
    sub: userId,
    quizId: quizId,
    jti: `launch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    typ: "launch"
  };
  
  return jwt.sign(payload, QUIZ_TOKEN_SECRET);
}

// Security logging utility is imported from securityLogger

// Export the utility function
exports.isQuizOpen = isQuizOpen;

exports.getQuizzes = function (req, res, next) {
  Quiz.find()
    .sort({ createdAt: -1 })
    .then((quizzes) => {
      console.log(`Found ${quizzes.length} quizzes in database`);
      res.json(quizzes);
    })
    .catch((error) => {
      console.error("Error fetching quizzes:", error);
      if (
        error.name === "MongoNetworkError" ||
        error.name === "MongoServerSelectionError"
      ) {
        console.log("Database not available, returning mock data");
        const mockQuizzes = [
          {
            _id: "1",
            title: "Introduction to Computer Science",
            description: "Basic concepts of computer science",
            moduleCode: "CS101",
            questions: [
              {
                _id: "1",
                questionText: "What is the primary purpose of an algorithm?",
                options: [
                  "To solve a specific problem efficiently",
                  "To make code more readable",
                  "To reduce file size",
                  "To improve computer performance",
                ],
                correctAnswerIndex: 0,
                feedback:
                  "Algorithms are step-by-step procedures designed to solve specific problems efficiently.",
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        return res.json(mockQuizzes);
      }
      res.status(500).json({ error: "Failed to fetch quizzes" });
    });
};

exports.getEligibleQuizzes = async function (req, res, next) {
  try {
    const now = new Date();
    const userId = req.user._id;
    
    log('avail.query.start', { 
      studentId: String(userId), 
      now: now.toISOString() 
    });
    
    // First, get all quizzes that match the basic criteria
    const query = {
      $and: [
        { startTime: { $lte: now } }, // Quiz has started
        {
          $or: [
            { endTime: null }, // No end time set (always available)
            { endTime: { $gte: now } } // End time is in the future
          ]
        },
        {
          $or: [
            { assignedStudentIds: { $exists: false } }, // No assignment restrictions
            { assignedStudentIds: { $size: 0 } }, // Empty assignment list (available to all)
            { assignedStudentIds: userId } // User is specifically assigned
          ]
        }
      ]
    };

    // Get all eligible quizzes
    const quizzes = await Quiz.find(query)
      .select('-accessCodeHash') // Exclude sensitive access code hash
      .sort({ startTime: -1 });

    log('avail.time_window', { 
      matchedQuizzes: quizzes.length,
      quizIds: quizzes.map(q => String(q._id))
    });

    // Get all quiz IDs that the student has already attempted
    const attemptedQuizIds = await Result.find({ studentId: userId })
      .select('quizId')
      .distinct('quizId');

    log('avail.attempts', { 
      count: attemptedQuizIds.length, 
      attemptedIds: attemptedQuizIds.map(id => String(id))
    });

    // Filter out quizzes that the student has already attempted
    const availableQuizzes = quizzes.filter(quiz => 
      !attemptedQuizIds.some(attemptedId => 
        attemptedId.toString() === quiz._id.toString()
      )
    );

    log('avail.result', { 
      availableCount: availableQuizzes.length,
      quizIds: availableQuizzes.map(q => String(q._id))
    });
    
    // Clean the data to ensure it's JSON serializable
    const cleanQuizzes = availableQuizzes.map(quiz => ({
      _id: quiz._id,
      title: quiz.title,
      moduleCode: quiz.moduleCode,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      duration: quiz.duration,
      createdBy: quiz.createdBy,
      assignedStudentIds: quiz.assignedStudentIds,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    }));
    
    res.json(cleanQuizzes);
  } catch (error) {
    log('avail.error', { error: error.message });
    console.error("Error fetching eligible quizzes:", error);
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerSelectionError"
    ) {
      console.log("Database not available, returning empty array for eligible quizzes");
      return res.json([]);
    }
    res.status(500).json({ error: "Failed to fetch eligible quizzes" });
  }
};

// Get completed quizzes for a student
exports.getCompletedQuizzes = async function (req, res, next) {
  try {
    const userId = req.user._id;
    
    // Fetch completed quizzes silently
    
    // Get all quiz results for this student
    const results = await Result.find({ studentId: userId })
      .populate('quizId', 'title moduleCode startTime endTime duration')
      .sort({ submittedAt: -1 });
    
    // Filter out results where quiz no longer exists (deleted quizzes)
    const completedQuizzes = results
      .filter(result => {
        if (!result.quizId) {
          console.log(`⚠️  Skipping result ${result._id} - referenced quiz no longer exists`);
          return false;
        }
        return true;
      })
      .map(result => ({
        _id: result.quizId._id,
        title: result.quizId.title,
        moduleCode: result.quizId.moduleCode,
        startTime: result.quizId.startTime,
        endTime: result.quizId.endTime,
        duration: result.quizId.duration,
        score: result.score,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeSpent: result.timeSpent,
        submittedAt: result.submittedAt
      }));
    
    // Return completed quizzes
    res.json(completedQuizzes);
  } catch (error) {
    console.error("Error fetching completed quizzes:", error);
    res.status(500).json({ error: "Failed to fetch completed quizzes" });
  }
};

exports.createQuiz = async function (req, res, next) {
  try {
    const quizData = { ...req.body };
    
    // Ensure startTime and endTime are properly formatted as ISO strings
    if (quizData.startTime) {
      quizData.startTime = new Date(quizData.startTime).toISOString();
    }
    if (quizData.endTime) {
      quizData.endTime = new Date(quizData.endTime).toISOString();
    }
    
    // Hash the access code if provided
    if (quizData.accessCode && quizData.accessCode.trim() !== "") {
      const saltRounds = 10;
      quizData.accessCodeHash = await bcrypt.hash(quizData.accessCode, saltRounds);
      delete quizData.accessCode; // Remove plaintext access code
    }
    
    // Process assigned students: ensure they are valid ObjectIds
    if (quizData.assignedStudentIds && Array.isArray(quizData.assignedStudentIds)) {
      const mongoose = require("mongoose");
      quizData.assignedStudentIds = quizData.assignedStudentIds
        .filter(id => id && mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      // Log student assignment for debugging
      if (quizData.assignedStudentIds.length > 0) {
        console.log(`[QUIZ] Quiz "${quizData.title}" assigned to ${quizData.assignedStudentIds.length} students`);
      }
    } else {
      quizData.assignedStudentIds = [];
    }
    
    // Process IP ranges: ensure they are stored as an array and validate each CIDR
    if (quizData.allowedIpCidrs) {
      if (Array.isArray(quizData.allowedIpCidrs)) {
        // If already an array, validate and clean each CIDR
        quizData.allowedIpCidrs = quizData.allowedIpCidrs
          .map(cidr => validateAndNormalizeCidr(cidr))
          .filter(cidr => cidr !== null); // Remove invalid CIDRs
      } else if (typeof quizData.allowedIpCidrs === 'string') {
        // If string, split by comma and process
        quizData.allowedIpCidrs = quizData.allowedIpCidrs
          .split(',')
          .map(cidr => validateAndNormalizeCidr(cidr))
          .filter(cidr => cidr !== null); // Remove invalid CIDRs
      } else {
        // If invalid type, set to empty array
        quizData.allowedIpCidrs = [];
      }
    } else {
      quizData.allowedIpCidrs = [];
    }
    
    // Log the processed IP ranges for debugging
    if (quizData.allowedIpCidrs.length > 0) {
      console.log(`[IPCHECK] Quiz "${quizData.title}" configured with IP ranges:`, quizData.allowedIpCidrs);
    }
    
    const quiz = new Quiz(quizData);
    const savedQuiz = await quiz.save();
    
    // Log the creation for debugging
    console.log(`Created quiz: ${savedQuiz.title} with accessCodeHash: ${savedQuiz.accessCodeHash ? 'YES' : 'NO'}`);
    
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(400).json({ error: "Failed to create quiz" });
  }
};

exports.getQuiz = async function (req, res, next) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Quiz ID is required" });
  }

  try {
    // Check if user is authenticated (for students taking quizzes)
    if (req.user && req.user.role === 'student') {
      // Allow access if this is for viewing results (has 'forResults' query parameter)
      const isForResults = req.query.forResults === 'true';
      
      if (!isForResults) {
        // Check if student has already submitted this quiz (only block if not for results)
        const existingResult = await Result.findOne({ 
          quizId: id, 
          studentId: req.user._id 
        });
        
        if (existingResult) {
          return res.status(403).json({ 
            error: "Quiz already submitted",
            message: "You have already completed this quiz and cannot access it again.",
            resultId: existingResult._id
          });
        }
      }
    }

    // First, get the quiz
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Then, get all questions for this quiz from the separate Question model
    const questions = await Question.find({ 
      quizId: id
    }).sort({ createdAt: 1 });

    // Transform questions to match the expected format
    const transformedQuestions = questions.map(q => ({
      _id: q._id,
      questionText: q.title, // Use title as questionText
      options: q.options,
      correctAnswerIndex: q.answerKey,
      feedback: q.feedback
    }));

    // Combine quiz data with questions
    const quizWithQuestions = {
      ...quiz.toObject(),
      questions: transformedQuestions
    };
    res.json(quizWithQuestions);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid quiz ID format" });
    }
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
};

// Get questions for a specific quiz
exports.getQuizQuestions = async function (req, res, next) {
  const { id } = req.params;
  const { search, sort = "-createdAt" } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Quiz ID is required" });
  }

  try {
    // Check if quiz exists
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Build dynamic query with filters
    const query = {
      quizId: id
    };

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }



    // Get questions with dynamic filtering
    const questions = await Question.find(query)
      .sort(sort)
      .select("-__v");

    console.log(`Found ${questions.length} questions for quiz ${id} with filters:`, { search });

    // Transform questions to match the expected format
    const transformedQuestions = questions.map(q => ({
      _id: q._id,
      title: q.title, // Use title
      options: q.options,
      answerKey: q.answerKey,
      correctAnswerIndex: q.answerKey,
      feedback: q.feedback,
      points: q.points || 1
    }));

    console.log(`Returning ${transformedQuestions.length} filtered questions for quiz ${id}`);
    res.json(transformedQuestions);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid quiz ID format" });
    }
    res.status(500).json({ error: "Failed to fetch quiz questions" });
  }
};

exports.updateQuiz = function (req, res, next) {
  Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedQuiz) => {
      if (!updatedQuiz)
        return res.status(404).json({ error: "Quiz not found" });
      res.json(updatedQuiz);
    })
    .catch((error) => {
      console.error("Error updating quiz:", error);
      res.status(400).json({ error: "Failed to update quiz" });
    });
};

exports.deleteQuiz = function (req, res, next) {
  Quiz.findByIdAndDelete(req.params.id)
    .then((deletedQuiz) => {
      if (!deletedQuiz)
        return res.status(404).json({ error: "Quiz not found" });
      res.json({ message: "Quiz deleted successfully" });
    })
    .catch((error) => {
      console.error("Error deleting quiz:", error);
      res.status(400).json({ error: "Failed to delete quiz" });
    });
};

exports.addQuestion = async function (req, res, next) {
  const quizId = req.params.id;
  // Accept both payload shapes from client components
  const incomingQuestionText = req.body.questionText || req.body.title;
  const incomingOptions = req.body.options;
  const incomingAnswerIndex =
    req.body.correctAnswerIndex !== undefined ? req.body.correctAnswerIndex : req.body.answerKey;
  const incomingFeedback = req.body.feedback;

  try {
    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Validate required fields
    if (
      incomingQuestionText === undefined ||
      !Array.isArray(incomingOptions) ||
      incomingOptions.length === 0 ||
      incomingAnswerIndex === undefined
    ) {
      return res.status(400).json({
        error: "Missing required fields: questionText, options, and correctAnswerIndex are required",
      });
    }

    // Create a new question in the separate Question model
    const newQuestion = new Question({
      quizId: quizId,
      title: incomingQuestionText,
      options: incomingOptions,
      answerKey: incomingAnswerIndex,
      points: 1,
      feedback: incomingFeedback || "",
    });

    const savedQuestion = await newQuestion.save();
    console.log("Added question to quiz:", {
      quizId,
      questionId: savedQuestion._id,
      questionText: incomingQuestionText,
      options: incomingOptions,
      correctAnswerIndex: incomingAnswerIndex,
    });

    // Return the saved question in the expected format for the quiz-taking UI
    const questionResponse = {
      _id: savedQuestion._id,
      questionText: savedQuestion.title,
      options: savedQuestion.options,
      correctAnswerIndex: savedQuestion.answerKey,
      feedback: savedQuestion.feedback,
    };

    res.status(201).json(questionResponse);
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ error: "Failed to add question" });
  }
};

exports.launchQuiz = async function (req, res, next) {
  const { quizId } = req.params;
  const { accessCode } = req.body;
  const userId = req.user.id;
  const userIp = req.ip || req.connection.remoteAddress;

  try {
    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      logSecurityEvent("QUIZ_LAUNCH_ATTEMPT", {
        userId,
        userIp,
        quizId,
        error: "Quiz not found"
      });
      return res.status(404).json({ 
        error: "Quiz not found",
        message: "The requested quiz does not exist or has been removed."
      });
    }

    // Check if quiz is currently open
    if (!isQuizOpen(quiz)) {
      logSecurityEvent("QUIZ_LAUNCH_ATTEMPT", {
        userId,
        userIp,
        quizId,
        quizTitle: quiz.title,
        error: "Quiz not open",
        currentTime: new Date().toISOString(),
        startTime: quiz.startTime,
        endTime: quiz.endTime
      });
      return res.status(403).json({ 
        error: "Quiz not open",
        message: "This quiz is not currently available. Please check the start and end times."
      });
    }

    // If quiz has an access code, verify it
    if (quiz.accessCodeHash) {
      if (!accessCode) {
        logSecurityEvent("ACCESS_CODE_MISSING", {
          userId,
          userIp,
          quizId,
          quizTitle: quiz.title
        });
        return res.status(403).json({ 
          error: "Access code required",
          message: "This quiz requires an access code to launch. Please enter the code provided by your instructor."
        });
      }
      
      const isValidCode = await bcrypt.compare(accessCode, quiz.accessCodeHash);
      if (!isValidCode) {
        logSecurityEvent("ACCESS_CODE_FAILED", {
          userId,
          userIp,
          quizId,
          quizTitle: quiz.title,
          providedCode: accessCode.substring(0, 3) + "***" // Log partial code for debugging
        });
        return res.status(403).json({ 
          error: "Invalid access code",
          message: "The access code you entered is incorrect. Please check with your instructor and try again."
        });
      }
    }

    // Check IP filtering if configured
    if (quiz.allowedIpCidrs && quiz.allowedIpCidrs.length > 0) {
      let allowed = isIpAllowed(userIp, quiz.allowedIpCidrs);

      // Local development convenience: if the request looks like localhost
      // but the machine's LAN IP is in the allowed list, treat as allowed.
      if (!allowed && (userIp === '127.0.0.1' || userIp === '::1')) {
        const serverLanIp = getLocalIPv4Address();
        if (serverLanIp) {
          allowed = isIpAllowed(serverLanIp, quiz.allowedIpCidrs);
        }
      }

      if (!allowed) {
        logSecurityEvent("IP_BLOCKED", {
          userId,
          userIp,
          quizId,
          quizTitle: quiz.title,
          configuredCidrs: quiz.allowedIpCidrs,
          serverLanIp: getLocalIPv4Address(),
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({
          error: "IP not allowed",
          message: "This quiz is only accessible from specific machines or networks."
        });
      }
    }

    // Generate launch ticket
    const ticket = signLaunchTicket(userId, quizId);
    
    logSecurityEvent("QUIZ_LAUNCH_SUCCESS", {
      userId,
      userIp,
      quizId,
      quizTitle: quiz.title,
      hasAccessCode: !!quiz.accessCodeHash
    });
    
    res.json({ 
      ticket,
      message: "Quiz launched successfully. You can now start the quiz."
    });
  } catch (error) {
    console.error("Error launching quiz:", error);
    logSecurityEvent("QUIZ_LAUNCH_ERROR", {
      userId,
      userIp,
      quizId,
      error: error.message
    });
    res.status(500).json({ 
      error: "Failed to launch quiz",
      message: "An unexpected error occurred while launching the quiz. Please try again."
    });
  }
};

exports.startQuiz = async function (req, res, next) {
  const { quizId } = req.params;
  const userId = req.user.id;
  const userIp = req.ip || req.connection.remoteAddress;

  try {
    // Check for single-use ticket reuse (if enabled)
    if (ENABLE_SINGLE_USE_TICKETS && req.launchTicket) {
      const jti = req.launchTicket.jti;
      
      // Check both in-memory cache and persistent storage
      const isUsedInMemory = usedTicketIds.has(jti);
      const isUsedInDB = await isTicketUsed(jti);
      
      if (isUsedInMemory || isUsedInDB) {
        logSecurityEvent("TICKET_REUSE_ATTEMPT", {
          userId,
          userIp,
          quizId,
          jti,
          foundInMemory: isUsedInMemory,
          foundInDB: isUsedInDB
        });
        return res.status(403).json({ 
          error: "Ticket already used",
          message: "This launch ticket has already been used. Please launch the quiz again to get a new ticket."
        });
      }
      
      // Mark ticket as used in both systems
      const expiryTime = req.launchTicket.exp * 1000; // Convert to milliseconds
      usedTicketIds.set(jti, expiryTime); // In-memory for fast lookup
      
      // Store persistently with metadata
      const ticketStored = await markTicketAsUsed(
        jti,
        expiryTime,
        quizId,
        userId,
        {
          userAgent: req.get('User-Agent'),
          ipAddress: userIp
        }
      );
      
      if (!ticketStored) {
        // This should be rare, but handle the case where DB storage fails due to duplicate
        logSecurityEvent("TICKET_STORAGE_CONFLICT", {
          userId,
          userIp,
          quizId,
          jti,
          message: "Ticket was already stored in database during concurrent request"
        });
        return res.status(403).json({ 
          error: "Ticket already used",
          message: "This launch ticket has already been used. Please launch the quiz again to get a new ticket."
        });
      }
    }

    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      logSecurityEvent("QUIZ_START_ATTEMPT", {
        userId,
        userIp,
        quizId,
        error: "Quiz not found"
      });
      return res.status(404).json({ 
        error: "Quiz not found",
        message: "The requested quiz does not exist or has been removed."
      });
    }

    // Check if quiz is currently open (double-check for security)
    if (!isQuizOpen(quiz)) {
      logSecurityEvent("QUIZ_START_ATTEMPT", {
        userId,
        userIp,
        quizId,
        quizTitle: quiz.title,
        error: "Quiz not open"
      });
      return res.status(403).json({ 
        error: "Quiz not open",
        message: "This quiz is not currently available. Please check the start and end times."
      });
    }

    // Check IP filtering if configured (double-check for security)
    if (quiz.allowedIpCidrs && quiz.allowedIpCidrs.length > 0) {
      let allowed = isIpAllowed(userIp, quiz.allowedIpCidrs);

      // Local development convenience: if request IP looks like localhost,
      // but the machine's LAN IP is allowed, treat as allowed.
      if (!allowed && (userIp === '127.0.0.1' || userIp === '::1')) {
        const serverLanIp = getLocalIPv4Address();
        if (serverLanIp) {
          allowed = isIpAllowed(serverLanIp, quiz.allowedIpCidrs);
        }
      }

      if (!allowed) {
        logSecurityEvent("IP_BLOCKED_START", {
          userId,
          userIp,
          quizId,
          quizTitle: quiz.title,
          configuredCidrs: quiz.allowedIpCidrs,
          serverLanIp: getLocalIPv4Address(),
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({
          error: "IP not allowed",
          message: "This quiz is only accessible from specific machines or networks."
        });
      }
    }

    // Get questions for this quiz
    const questions = await Question.find({ 
      quizId: quizId
    }).sort({ createdAt: 1 });

    // Return minimal payload for quiz taking page
    const quizPayload = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      moduleCode: quiz.moduleCode,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      totalQuestions: questions.length,
      questions: questions.map(q => ({
        _id: q._id,
        questionText: q.title,
        options: q.options,
        // Don't include correctAnswerIndex or feedback for security
      })),
      launchTicket: req.launchTicket // Include ticket info for reference
    };

    logSecurityEvent("QUIZ_START_SUCCESS", {
      userId,
      userIp,
      quizId,
      quizTitle: quiz.title,
      totalQuestions: questions.length
    });
    
    res.json(quizPayload);
  } catch (error) {
    console.error("Error starting quiz:", error);
    logSecurityEvent("QUIZ_START_ERROR", {
      userId,
      userIp,
      quizId,
      error: error.message
    });
    res.status(500).json({ 
      error: "Failed to start quiz",
      message: "An unexpected error occurred while starting the quiz. Please try again."
    });
  }
};
