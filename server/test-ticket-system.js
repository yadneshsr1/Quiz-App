#!/usr/bin/env node

/**
 * Comprehensive Ticket System Test Runner
 * 
 * This script runs all ticket-related tests and provides detailed reporting
 * on the persistent ticket tracking system functionality.
 * 
 * Usage:
 *   node test-ticket-system.js [options]
 * 
 * Options:
 *   --verbose    Show detailed output
 *   --coverage   Run with coverage reporting
 *   --integration Run integration tests only
 *   --unit       Run unit tests only
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_CONFIG = {
  testTimeout: 30000,
  setupTimeout: 10000,
  mongoMemoryServerOptions: {
    binary: {
      skipMD5: true
    }
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose'),
  coverage: args.includes('--coverage'),
  integration: args.includes('--integration'),
  unit: args.includes('--unit')
};

console.log('🎯 Ticket System Test Runner');
console.log('==============================\n');

// Test files to run
const testFiles = [];

if (!options.integration) {
  testFiles.push('tests/ticket-tracking.test.js');
}

if (!options.unit) {
  testFiles.push('tests/ticket-integration.test.js');
}

// If no specific type selected, run all
if (!options.integration && !options.unit) {
  // Already added both above
}

async function runTests() {
  console.log('📋 Test Configuration:');
  console.log(`   • Test Timeout: ${TEST_CONFIG.testTimeout}ms`);
  console.log(`   • Setup Timeout: ${TEST_CONFIG.setupTimeout}ms`);
  console.log(`   • Verbose Output: ${options.verbose ? 'Yes' : 'No'}`);
  console.log(`   • Coverage Report: ${options.coverage ? 'Yes' : 'No'}`);
  console.log(`   • Test Files: ${testFiles.length}`);
  testFiles.forEach(file => console.log(`     - ${file}`));
  console.log('');

  // Check if required dependencies are installed
  console.log('🔍 Checking Dependencies...');
  const requiredDeps = [
    'jest',
    'supertest',
    'mongodb-memory-server'
  ];

  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
  
  if (missingDeps.length > 0) {
    console.log('❌ Missing dependencies:');
    missingDeps.forEach(dep => console.log(`   • ${dep}`));
    console.log('\nInstall missing dependencies with:');
    console.log(`npm install --save-dev ${missingDeps.join(' ')}`);
    process.exit(1);
  }
  
  console.log('✅ All dependencies found\n');

  // Set up Jest configuration
  const jestConfig = {
    testEnvironment: 'node',
    testTimeout: TEST_CONFIG.testTimeout,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: [
      'models/UsedTicket.js',
      'utils/ticketManager.js',
      'jobs/ticketCleanup.js',
      'controllers/quizController.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: options.verbose
  };

  // Write temporary Jest config
  const jestConfigPath = path.join(__dirname, 'jest.config.temp.js');
  fs.writeFileSync(jestConfigPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);

  try {
    console.log('🧪 Running Tests...\n');
    
    // Build Jest command
    const jestArgs = [
      '--config', jestConfigPath,
      '--runInBand', // Run tests serially to avoid database conflicts
      '--forceExit'  // Ensure process exits after tests
    ];

    if (options.coverage) {
      jestArgs.push('--coverage');
    }

    // Add test file patterns
    testFiles.forEach(file => jestArgs.push(file));

    // Run Jest
    const jestProcess = spawn('npx', ['jest', ...jestArgs], {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    jestProcess.on('close', (code) => {
      // Clean up temporary config
      try {
        fs.unlinkSync(jestConfigPath);
      } catch (err) {
        // Ignore cleanup errors
      }

      if (code === 0) {
        console.log('\n✅ All tests passed!');
        console.log('\n📊 Test Summary:');
        console.log('   • Ticket Model Schema: ✅');
        console.log('   • TTL Index Configuration: ✅');
        console.log('   • Ticket Manager Functions: ✅');
        console.log('   • Cleanup Job: ✅');
        console.log('   • Error Handling: ✅');
        console.log('   • Performance Tests: ✅');
        
        if (options.coverage) {
          console.log('\n📈 Coverage report generated in ./coverage/');
        }
        
        console.log('\n🎉 Ticket system is ready for production!');
      } else {
        console.log('\n❌ Some tests failed.');
        console.log('\n🔧 Common issues to check:');
        console.log('   • MongoDB connection');
        console.log('   • Environment variables');
        console.log('   • Integration between persistent and in-memory storage');
        console.log('   • TTL index creation');
        process.exit(code);
      }
    });

    jestProcess.on('error', (err) => {
      console.error('❌ Failed to run tests:', err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Performance benchmark function
async function runPerformanceBenchmark() {
  console.log('🚀 Running Performance Benchmark...\n');
  
  const mongoose = require('mongoose');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const ticketManager = require('./utils/ticketManager');
  const UsedTicket = require('./models/UsedTicket');

  let mongoServer;
  
  try {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    console.log('📊 Benchmark Results:');
    console.log('====================');

    // Test 1: Bulk ticket creation
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 1000; i++) {
      promises.push(ticketManager.markTicketAsUsed(
        `bench_${i}`,
        Date.now() + 10 * 60 * 1000,
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        { ipAddress: `192.168.1.${i % 255}` }
      ));
    }

    await Promise.all(promises);
    const creationTime = Date.now() - startTime;
    
    console.log(`✅ Created 1000 tickets in ${creationTime}ms (${(1000/creationTime*1000).toFixed(2)} tickets/sec)`);

    // Test 2: Bulk ticket lookup
    const lookupStart = Date.now();
    const lookupPromises = [];
    
    for (let i = 0; i < 1000; i++) {
      lookupPromises.push(ticketManager.isTicketUsed(`bench_${i}`));
    }

    await Promise.all(lookupPromises);
    const lookupTime = Date.now() - lookupStart;
    
    console.log(`✅ Looked up 1000 tickets in ${lookupTime}ms (${(1000/lookupTime*1000).toFixed(2)} lookups/sec)`);

    // Test 3: Cleanup performance
    const cleanupStart = Date.now();
    const deletedCount = await ticketManager.cleanupExpiredTickets();
    const cleanupTime = Date.now() - cleanupStart;
    
    console.log(`✅ Cleanup completed in ${cleanupTime}ms (removed ${deletedCount} tickets)`);

    // Test 4: Index usage verification
    const stats = await UsedTicket.collection.stats();
    console.log(`✅ Collection stats: ${stats.count} documents, ${stats.totalIndexSize} bytes of indexes`);

  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

// Main execution
if (args.includes('--benchmark')) {
  runPerformanceBenchmark();
} else {
  runTests();
}
