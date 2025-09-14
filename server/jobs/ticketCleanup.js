const cron = require("node-cron");
const { cleanupExpiredTickets } = require("../utils/ticketManager");

// Schedule cleanup job to run every hour and log statistics
cron.schedule("0 * * * *", async () => {
  try {
    console.log("Starting expired tickets cleanup job");
    const deletedCount = await cleanupExpiredTickets();
    console.log(
      `Completed expired tickets cleanup job. Removed ${deletedCount} expired tickets`
    );
  } catch (error) {
    console.error("Error in ticket cleanup job:", error);
  }
});
