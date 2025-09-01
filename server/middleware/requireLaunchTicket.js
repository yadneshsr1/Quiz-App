const jwt = require("jsonwebtoken");

// Configuration constants
const CLOCK_SKEW_TOLERANCE_MS = parseInt(process.env.CLOCK_SKEW_TOLERANCE_MS) || 60000; // 60 seconds default

const requireLaunchTicket = (req, res, next) => {
  const launchTicket = req.headers['x-quiz-launch'] || req.body.launchTicket;
  
  if (!launchTicket) {
    return res.status(401).json({ 
      error: "Launch ticket required",
      message: "A valid launch ticket is required to access this quiz. Please launch the quiz first."
    });
  }

  try {
    const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || "quiz-launch-secret-dev-only";
    const decoded = jwt.verify(launchTicket, QUIZ_TOKEN_SECRET);
    
    // Verify ticket type
    if (decoded.typ !== "launch") {
      return res.status(403).json({ 
        error: "Invalid ticket type",
        message: "The provided ticket is not a valid launch ticket."
      });
    }
    
    // Verify ticket is not expired (with clock skew tolerance)
    const now = Math.floor(Date.now() / 1000);
    const toleranceSeconds = Math.floor(CLOCK_SKEW_TOLERANCE_MS / 1000);
    if (decoded.exp < now - toleranceSeconds) {
      return res.status(403).json({ 
        error: "Launch ticket expired",
        message: "Your launch ticket has expired. Please launch the quiz again to get a new ticket."
      });
    }
    
    // Verify quizId matches the request
    if (decoded.quizId !== req.params.quizId) {
      return res.status(403).json({ 
        error: "Launch ticket mismatch",
        message: "The launch ticket is not valid for this quiz. Please launch the correct quiz."
      });
    }
    
    // Verify user matches the ticket
    if (decoded.sub !== req.user.id) {
      return res.status(403).json({ 
        error: "Launch ticket user mismatch",
        message: "The launch ticket was issued for a different user. Please log in with the correct account."
      });
    }
    
    // Add decoded ticket info to request for potential use
    req.launchTicket = decoded;
    next();
  } catch (error) {
    console.error("Launch ticket verification error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ 
        error: "Invalid launch ticket",
        message: "The launch ticket is invalid or has been tampered with. Please launch the quiz again."
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ 
        error: "Launch ticket expired",
        message: "Your launch ticket has expired. Please launch the quiz again to get a new ticket."
      });
    }
    return res.status(403).json({ 
      error: "Launch ticket verification failed",
      message: "Unable to verify the launch ticket. Please try launching the quiz again."
    });
  }
};

module.exports = requireLaunchTicket;
