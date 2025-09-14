const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const resultRoutes = require("./routes/resultRoutes");
const questionRoutes = require("./routes/questionRoutes");
const debugRoutes = require("./routes/debugRoutes");
const securityHeaders = require("./middleware/securityHeaders");
const { cacheMiddleware } = require("./middleware/cacheMiddleware");

// Import cleanup job
require("./jobs/ticketCleanup");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB with the enhanced connection handler
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

// Get server IP for external access
const os = require("os");
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === "IPv4" && !interface.internal) {
        return interface.address;
      }
    }
  }
  return "localhost";
};

const localIP = getLocalIP();

// CORS configuration for external access
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5000",
    `http://${localIP}:3000`,
    `http://${localIP}:5000`,
    "https://localhost:3000",
    "https://localhost:5000",
    `https://${localIP}:3000`,
    `https://${localIP}:5000`,
    // Allow any origin for external access (you can restrict this later)
    /^https?:\/\/.*$/,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(securityHeaders);
app.use(cacheMiddleware);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/debug", debugRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "../client/build")));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quiz-app")
  .then(async () => {
    console.log("MongoDB connected to:", mongoose.connection.host);

    // Ensure indexes are created
    try {
      const Result = require("./models/Result");
      await Result.syncIndexes();
      console.log("✅ Result model indexes synced");
    } catch (indexError) {
      console.error("⚠️  Index sync error:", indexError.message);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// HTTPS Configuration
const httpsOptions = {
  key: process.env.SSL_KEY_PATH
    ? fs.readFileSync(process.env.SSL_KEY_PATH)
    : null,
  cert: process.env.SSL_CERT_PATH
    ? fs.readFileSync(process.env.SSL_CERT_PATH)
    : null,
};

// Create servers
const httpServer = http.createServer(app);
const httpsServer =
  httpsOptions.key && httpsOptions.cert
    ? https.createServer(httpsOptions, app)
    : null;

// Start servers
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Server accessible at:");
  console.log(`  - Local: http://localhost:${PORT}`);
  console.log(`  - Network: http://${localIP}:${PORT}`);

  if (httpsServer) {
    console.log(`  - HTTPS: https://${localIP}:${PORT + 1}`);
  }

  console.log(
    `IP filtering: ${
      process.env.ENABLE_IP_FILTERING === "true" ? "ENABLED" : "DISABLED"
    }`
  );
  console.log(
    `Trust proxy: ${
      process.env.TRUST_PROXY === "true" ? "ENABLED" : "DISABLED"
    }`
  );
});

if (httpsServer) {
  httpsServer.listen(PORT + 1, () => {
    console.log(`HTTPS Server running on port ${PORT + 1}`);
    console.log(`HTTPS accessible at: https://${localIP}:${PORT + 1}`);
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  httpServer.close(() => {
    console.log("HTTP server closed");
    if (httpsServer) {
      httpsServer.close(() => {
        console.log("HTTPS server closed");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});
