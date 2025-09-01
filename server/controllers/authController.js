const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Register new user
exports.register = async function (req, res, next) {
  try {
    const {
      username,
      password,
      role,
      name,
      email,
      regNo,
      course,
      moduleCode,
      department,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    const user = new User({
      username,
      password, // Store password as-is for now
      role,
      name,
      email,
      regNo,
      course,
      moduleCode,
      department,
    });

    const savedUser = await user.save();

    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        role: savedUser.role,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(400).json({ error: "Failed to register user" });
  }
};

// Login user
exports.login = async function (req, res, next) {
  try {
    const { username, password } = req.body;

    console.log("Login attempt:", { username, password });

    // Find user
    const user = await User.findOne({ username });
    console.log(
      "Found user:",
      user
        ? {
            id: user._id,
            username: user.username,
            password: user.password,
          }
        : null
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Simple password check
    if (password !== user.password) {
      console.log(
        "Password mismatch. Expected:",
        user.password,
        "Got:",
        password
      );
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};
