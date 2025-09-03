/**
 * Debug script to decode the current user token from localStorage
 */

const jwt = require('jsonwebtoken');

// You'll need to copy the token from your browser's localStorage
const token = process.argv[2];

if (!token) {
  console.log("❌ Please provide a token as an argument");
  console.log("Usage: node debug-current-user.js YOUR_JWT_TOKEN");
  console.log("\nTo get your token:");
  console.log("1. Open browser console");
  console.log("2. Run: localStorage.getItem('token')");
  console.log("3. Copy the token and run this script");
  process.exit(1);
}

try {
  // Decode without verification to see the payload
  const decoded = jwt.decode(token);
  console.log("🔍 Current user info:");
  console.log(`   User ID: ${decoded.userId}`);
  console.log(`   Role: ${decoded.role}`);
  console.log(`   Issued at: ${new Date(decoded.iat * 1000)}`);
  console.log(`   Expires at: ${new Date(decoded.exp * 1000)}`);
  
  if (decoded.exp * 1000 < Date.now()) {
    console.log("⚠️  WARNING: Token has expired!");
  }
} catch (error) {
  console.error("❌ Error decoding token:", error.message);
}
