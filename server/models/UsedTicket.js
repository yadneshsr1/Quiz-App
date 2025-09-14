const mongoose = require("mongoose");

const usedTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "Unique identifier for the launch ticket (JWT jti claim)",
    },
    expiresAt: {
      type: Date,
      required: true,
      description: "Expiration time of the ticket",
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      description: "Reference to the quiz this ticket was used for",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      description: "Reference to the user who used this ticket",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      description: "Timestamp when the ticket was used",
    },
    userAgent: {
      type: String,
      required: false,
      description: "User agent string from the request",
    },
    ipAddress: {
      type: String,
      required: false,
      description: "IP address of the request",
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic cleanup of expired tickets
usedTicketSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: "ticket_ttl_index",
  }
);

// Compound index for querying tickets by quiz and user
usedTicketSchema.index(
  {
    quizId: 1,
    userId: 1,
  },
  {
    name: "quiz_user_index",
  }
);

// Compound index for analytics queries
usedTicketSchema.index(
  {
    createdAt: -1,
    quizId: 1,
  },
  {
    name: "analytics_index",
  }
);

const UsedTicket = mongoose.model("UsedTicket", usedTicketSchema);

module.exports = UsedTicket;
