const UsedTicket = require("../models/UsedTicket");

/**
 * Marks a launch ticket as used in the database
 * @param {string} jti - Unique ticket identifier
 * @param {number} expirationTime - Ticket expiration timestamp
 * @param {string} quizId - ID of the quiz
 * @param {string} userId - ID of the user
 * @param {Object} metadata - Additional metadata about the ticket usage
 * @returns {Promise<boolean>} - True if ticket was successfully marked as used
 */
async function markTicketAsUsed(
  jti,
  expirationTime,
  quizId,
  userId,
  metadata = {}
) {
  try {
    await UsedTicket.create({
      ticketId: jti,
      expiresAt: new Date(expirationTime),
      quizId,
      userId,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });
    console.log(
      `Ticket ${jti} marked as used for quiz ${quizId} by user ${userId}`
    );
    return true;
  } catch (error) {
    if (error.code === 11000) {
      console.warn(
        `Attempt to reuse ticket ${jti} for quiz ${quizId} by user ${userId}`
      );
      return false;
    }
    console.error("Error marking ticket as used:", error);
    throw error;
  }
}

/**
 * Checks if a ticket has already been used
 * @param {string} jti - Unique ticket identifier
 * @returns {Promise<boolean>} - True if ticket has been used
 */
async function isTicketUsed(jti) {
  try {
    const ticket = await UsedTicket.findOne({ ticketId: jti });
    return !!ticket;
  } catch (error) {
    console.error("Error checking ticket usage:", error);
    throw error;
  }
}

/**
 * Cleans up expired tickets (backup for TTL index)
 * @returns {Promise<number>} - Number of tickets cleaned up
 */
async function cleanupExpiredTickets() {
  const now = new Date();
  try {
    const result = await UsedTicket.deleteMany({
      expiresAt: { $lt: now },
    });
    console.log(`Cleaned up ${result.deletedCount} expired tickets`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up expired tickets:", error);
    throw error;
  }
}

/**
 * Gets usage statistics for a quiz
 * @param {string} quizId - ID of the quiz
 * @returns {Promise<Object>} - Usage statistics
 */
async function getQuizTicketStats(quizId) {
  try {
    const stats = await UsedTicket.aggregate([
      { $match: { quizId: quizId } },
      {
        $group: {
          _id: null,
          totalUsed: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
          uniqueIPs: { $addToSet: "$ipAddress" },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsed: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          uniqueIPs: { $size: "$uniqueIPs" },
        },
      },
    ]).exec();
    return stats[0] || { totalUsed: 0, uniqueUsers: 0, uniqueIPs: 0 };
  } catch (error) {
    console.error("Error getting quiz ticket stats:", error);
    throw error;
  }
}

module.exports = {
  markTicketAsUsed,
  isTicketUsed,
  cleanupExpiredTickets,
  getQuizTicketStats,
};
