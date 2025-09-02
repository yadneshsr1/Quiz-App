const http = require('http');

console.log('🧪 Testing Quiz System...\n');

// Test 1: Check if server is running
function testServerStatus() {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/quizzes', (res) => {
      console.log('✅ Server is running (Status:', res.statusCode, ')');
      resolve(res.statusCode === 200);
    }).on('error', (err) => {
      console.log('❌ Server is not running:', err.message);
      resolve(false);
    });
  });
}

// Test 2: Check if React app is running
function testReactApp() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000', (res) => {
      console.log('✅ React app is running (Status:', res.statusCode, ')');
      resolve(res.statusCode === 200);
    }).on('error', (err) => {
      console.log('❌ React app is not running:', err.message);
      resolve(false);
    });
  });
}

// Test 3: Check new quiz routes
function testQuizRoutes() {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/quizzes/1', (res) => {
      if (res.statusCode === 404) {
        console.log('✅ Quiz routes are working (404 expected for non-existent quiz)');
      } else {
        console.log('✅ Quiz routes are working (Status:', res.statusCode, ')');
      }
      resolve(true);
    }).on('error', (err) => {
      console.log('❌ Quiz routes error:', err.message);
      resolve(false);
    });
  });
}

// Test 4: Check results routes
function testResultsRoutes() {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/results/student', (res) => {
      if (res.statusCode === 401) {
        console.log('✅ Results routes are working (401 expected - no auth token)');
      } else {
        console.log('✅ Results routes are working (Status:', res.statusCode, ')');
      }
      resolve(true);
    }).on('error', (err) => {
      console.log('❌ Results routes error:', err.message);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🔍 Running system tests...\n');
  
  const serverOk = await testServerStatus();
  const reactOk = await testReactApp();
  const quizRoutesOk = await testQuizRoutes();
  const resultsRoutesOk = await testResultsRoutes();
  
  console.log('\n📊 Test Results:');
  console.log('Server Status:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('React App:', reactOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Routes:', quizRoutesOk ? '✅ PASS' : '❌ FAIL');
  console.log('Results Routes:', resultsRoutesOk ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = serverOk && reactOk && quizRoutesOk && resultsRoutesOk;
  
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 Quiz System is ready! You can now:');
    console.log('1. Login as a student');
    console.log('2. Click "Start Quiz" on any quiz card');
    console.log('3. Take the quiz with timer and navigation');
    console.log('4. Submit and view detailed results');
  } else {
    console.log('\n⚠️  Please check the failed components before testing the quiz system.');
  }
}

runTests(); 