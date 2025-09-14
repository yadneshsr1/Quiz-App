module.exports = {
  "testEnvironment": "node",
  "testTimeout": 30000,
  "setupFilesAfterEnv": [
    "<rootDir>/tests/setup.js"
  ],
  "collectCoverageFrom": [
    "models/UsedTicket.js",
    "utils/ticketManager.js",
    "jobs/ticketCleanup.js",
    "controllers/quizController.js"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "verbose": false
};