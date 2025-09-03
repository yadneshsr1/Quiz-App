/**
 * Structured JSON logger for debugging quiz availability and submission
 */

const log = (label, obj = {}) => {
  try {
    const logEntry = {
      ts: new Date().toISOString(),
      label,
      ...obj
    };
    console.log(JSON.stringify(logEntry));
  } catch (error) {
    // Fallback for circular references or other JSON issues
    console.log(`[log:${label}]`, obj);
  }
};

module.exports = { log };
