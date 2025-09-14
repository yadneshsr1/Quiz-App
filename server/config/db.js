const mongoose = require("mongoose");
const { cleanupExpiredTickets } = require("../utils/ticketManager");

async function connectDB() {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quiz-app";

    // Configure mongoose
    mongoose.set("strictQuery", true);

    // Connect with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(
          `Failed to connect to MongoDB. Retrying... (${retries} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.log("MongoDB connected successfully");

    // Ensure indexes are created for the UsedTicket collection
    const UsedTicket = require("../models/UsedTicket");
    await UsedTicket.syncIndexes();
    console.log("UsedTicket indexes synchronized");

    // Run initial cleanup of expired tickets
    const cleanedCount = await cleanupExpiredTickets();
    console.log(
      `Initial ticket cleanup completed: removed ${cleanedCount} expired tickets`
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

module.exports = connectDB;
