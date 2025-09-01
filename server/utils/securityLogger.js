/**
 * Security logging utility for quiz application
 * Provides centralized logging for security events
 */

/**
 * Log security events with timestamp and structured data
 * @param {string} event - Event type (e.g., "QUIZ_LAUNCH_SUCCESS", "IP_BLOCKED")
 * @param {object} details - Event details object
 */
function logSecurityEvent(event, details) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
}

module.exports = {
  logSecurityEvent
};
