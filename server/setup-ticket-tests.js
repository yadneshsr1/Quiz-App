#!/usr/bin/env node

/**
 * Setup Script for Ticket System Tests
 * 
 * This script installs required dependencies and sets up the testing environment
 * for the persistent ticket tracking system.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 Setting up Ticket System Tests');
console.log('==================================\n');

// Check if we're in the server directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the server directory.');
  process.exit(1);
}

// Read current package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('📦 Current project:', packageJson.name || 'Unknown');
console.log('📦 Version:', packageJson.version || 'Unknown');
console.log('');

// Required dependencies
const requiredDevDeps = {
  'jest': '^29.0.0',
  'supertest': '^6.0.0',
  'mongodb-memory-server': '^8.0.0'
};

// Check existing dependencies
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
const missingDeps = [];
const outdatedDeps = [];

console.log('🔍 Checking dependencies...');

for (const [dep, version] of Object.entries(requiredDevDeps)) {
  if (!allDeps[dep]) {
    missingDeps.push(`${dep}@${version}`);
    console.log(`   ❌ Missing: ${dep}`);
  } else {
    console.log(`   ✅ Found: ${dep}@${allDeps[dep]}`);
  }
}

console.log('');

// Install missing dependencies
if (missingDeps.length > 0) {
  console.log('📥 Installing missing dependencies...');
  console.log(`   npm install --save-dev ${missingDeps.join(' ')}`);
  
  try {
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Dependencies installed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    console.log('\nPlease install manually:');
    console.log(`npm install --save-dev ${missingDeps.join(' ')}`);
    process.exit(1);
  }
} else {
  console.log('✅ All required dependencies are already installed!\n');
}

// Create Jest configuration if it doesn't exist
const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
if (!fs.existsSync(jestConfigPath)) {
  console.log('⚙️  Creating Jest configuration...');
  
  const jestConfig = `module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'models/**/*.js',
    'utils/**/*.js',
    'jobs/**/*.js',
    'controllers/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: false
};`;

  fs.writeFileSync(jestConfigPath, jestConfig);
  console.log('✅ Jest configuration created\n');
}

// Update package.json scripts
console.log('📝 Updating package.json scripts...');

const updatedPackageJson = { ...packageJson };

if (!updatedPackageJson.scripts) {
  updatedPackageJson.scripts = {};
}

// Add test scripts
const newScripts = {
  'test:tickets': 'node test-ticket-system.js',
  'test:tickets:unit': 'node test-ticket-system.js --unit',
  'test:tickets:integration': 'node test-ticket-system.js --integration',
  'test:tickets:coverage': 'node test-ticket-system.js --coverage',
  'test:tickets:benchmark': 'node test-ticket-system.js --benchmark'
};

let scriptsAdded = 0;
for (const [scriptName, scriptCommand] of Object.entries(newScripts)) {
  if (!updatedPackageJson.scripts[scriptName]) {
    updatedPackageJson.scripts[scriptName] = scriptCommand;
    scriptsAdded++;
    console.log(`   ✅ Added script: ${scriptName}`);
  } else {
    console.log(`   ⚠️  Script exists: ${scriptName}`);
  }
}

if (scriptsAdded > 0) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
  console.log(`✅ Added ${scriptsAdded} new scripts to package.json\n`);
} else {
  console.log('✅ All scripts already exist\n');
}

// Check MongoDB setup
console.log('🗄️  Checking MongoDB setup...');

// Check if mongoose is installed
if (allDeps.mongoose) {
  console.log('   ✅ Mongoose found');
} else {
  console.log('   ⚠️  Mongoose not found - you may need to install it');
}

// Check if MongoDB models exist
const modelsDir = path.join(process.cwd(), 'models');
const usedTicketModel = path.join(modelsDir, 'UsedTicket.js');

if (fs.existsSync(usedTicketModel)) {
  console.log('   ✅ UsedTicket model found');
} else {
  console.log('   ❌ UsedTicket model not found');
}

console.log('');

// Final setup verification
console.log('🧪 Running setup verification...');

try {
  // Try to require key modules
  require('./models/UsedTicket');
  console.log('   ✅ UsedTicket model loads correctly');
  
  require('./utils/ticketManager');
  console.log('   ✅ ticketManager utils load correctly');
  
  require('./jobs/ticketCleanup');
  console.log('   ✅ ticketCleanup job loads correctly');
  
} catch (error) {
  console.log(`   ❌ Module loading error: ${error.message}`);
  console.log('   Please check your file structure and dependencies');
}

console.log('');

// Environment variables check
console.log('🔧 Environment Variables Check:');
const envVars = [
  'ENABLE_SINGLE_USE_TICKETS',
  'LAUNCH_TICKET_TTL_MIN',
  'QUIZ_TOKEN_SECRET'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${envVar === 'QUIZ_TOKEN_SECRET' ? '[HIDDEN]' : value}`);
  } else {
    console.log(`   ⚠️  ${envVar}: Not set (will use default)`);
  }
});

console.log('');

// Success message
console.log('🎉 Setup Complete!');
console.log('==================');
console.log('');
console.log('📋 Available Commands:');
console.log('   npm run test:tickets              - Run all ticket tests');
console.log('   npm run test:tickets:unit         - Run unit tests only');
console.log('   npm run test:tickets:integration  - Run integration tests only');
console.log('   npm run test:tickets:coverage     - Run tests with coverage');
console.log('   npm run test:tickets:benchmark    - Run performance benchmark');
console.log('');
console.log('📖 Documentation:');
console.log('   • TICKET_TESTING_GUIDE.md - Comprehensive testing guide');
console.log('   • tests/ticket-tracking.test.js - Unit tests');
console.log('   • tests/ticket-integration.test.js - Integration tests');
console.log('');
console.log('🚀 Ready to test! Run: npm run test:tickets');

// Make the test runner executable
try {
  fs.chmodSync(path.join(process.cwd(), 'test-ticket-system.js'), '755');
} catch (error) {
  // Ignore chmod errors on Windows
}
