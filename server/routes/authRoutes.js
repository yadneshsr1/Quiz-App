const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const { validatePhotoUrl } = require("../utils/photoValidation");
const { setPhotoCacheHeaders } = require("../middleware/cacheMiddleware");
const { getFeatureFlag } = require("../config/featureFlags");

// Feature flag for student photo display
const SHOW_STUDENT_PHOTO = getFeatureFlag('SHOW_STUDENT_PHOTO');

// Register new user
router.post("/register", authController.register);

// Login user
router.post("/login", authController.login);

// Get current user (uses JWT middleware)
router.get("/me", auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    res.json(req.user);
  } catch (error) {
    console.error("Auth /me error:", error);
    res.status(500).json({ error: "Failed to fetch current user" });
  }
});

// Get feature flags status (admin only)
router.get("/feature-flags", auth, requireRole(["academic"]), async (req, res) => {
  try {
    const { getActiveFeatureFlags, validateFeatureFlags } = require("../config/featureFlags");
    const activeFlags = getActiveFeatureFlags();
    const validation = validateFeatureFlags();
    
    res.json({
      activeFlags,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Auth /feature-flags error:", error);
    res.status(500).json({ error: "Failed to fetch feature flags" });
  }
});

// Get current user's photo (feature flagged)
if (SHOW_STUDENT_PHOTO) {
  router.get("/me/photo", auth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Validate and sanitize photo URL if it exists
      let photoUrl = req.user.photograph || null;
      if (photoUrl) {
        const validation = validatePhotoUrl(photoUrl);
        if (!validation.isValid) {
          console.warn(`Invalid photo URL for user ${req.user._id}: ${validation.error}`);
          photoUrl = null; // Return null for invalid URLs
        } else {
          photoUrl = validation.sanitizedUrl;
        }
      }
      
      // Set proper cache headers
      setPhotoCacheHeaders(res, req.user._id.toString(), photoUrl);
      
      // Return only the photograph field
      res.json({ 
        photoUrl: photoUrl
      });
    } catch (error) {
      console.error("Auth /me/photo error:", error);
      res.status(500).json({ error: "Failed to fetch user photo" });
    }
  });

  // Get student photo by ID (academic role only)
  router.get("/students/:id/photo", auth, requireRole(["academic"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find the student user - include role field for validation
      const student = await User.findById(id).select("photograph name regNo role");
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      if (student.role !== "student") {
        return res.status(400).json({ error: "User is not a student" });
      }
      
      // Validate and sanitize photo URL if it exists
      let photoUrl = student.photograph || null;
      if (photoUrl) {
        const validation = validatePhotoUrl(photoUrl);
        if (!validation.isValid) {
          console.warn(`Invalid photo URL for student ${id}: ${validation.error}`);
          photoUrl = null; // Return null for invalid URLs
        } else {
          photoUrl = validation.sanitizedUrl;
        }
      }
      
      // Set proper cache headers
      setPhotoCacheHeaders(res, id, photoUrl);
      
      // Return student photo info (read-only)
      res.json({ 
        photoUrl: photoUrl,
        studentName: student.name,
        regNo: student.regNo
      });
    } catch (error) {
      console.error("Auth /students/:id/photo error:", error);
      res.status(500).json({ error: "Failed to fetch student photo" });
    }
  });
}

module.exports = router;
