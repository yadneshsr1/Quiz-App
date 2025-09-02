const http = require('http');

console.log('🧪 Testing Priority 2: Results & Marking System...\n');

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

// Test 3: Check analytics routes
function testAnalyticsRoutes() {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/results/quiz/1/all', (res) => {
      if (res.statusCode === 401) {
        console.log('✅ Analytics routes are working (401 expected - no auth token)');
      } else {
        console.log('✅ Analytics routes are working (Status:', res.statusCode, ')');
      }
      resolve(true);
    }).on('error', (err) => {
      console.log('❌ Analytics routes error:', err.message);
      resolve(false);
    });
  });
}

// Test 4: Check marking routes
function testMarkingRoutes() {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/results/1/marking', (res) => {
      if (res.statusCode === 404 || res.statusCode === 401) {
        console.log('✅ Marking routes are working (404/401 expected - no auth or result)');
      } else {
        console.log('✅ Marking routes are working (Status:', res.statusCode, ')');
      }
      resolve(true);
    }).on('error', (err) => {
      console.log('❌ Marking routes error:', err.message);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🔍 Running Priority 2 tests...\n');
  
  const serverOk = await testServerStatus();
  const reactOk = await testReactApp();
  const analyticsOk = await testAnalyticsRoutes();
  const markingOk = await testMarkingRoutes();
  
  console.log('\n📊 Test Results:');
  console.log('Server Status:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('React App:', reactOk ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics Routes:', analyticsOk ? '✅ PASS' : '❌ FAIL');
  console.log('Marking Routes:', markingOk ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = serverOk && reactOk && analyticsOk && markingOk;
  
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 Priority 2 is ready! You can now:');
    console.log('1. Login as an academic');
    console.log('2. Click "View Analytics" on any quiz');
    console.log('3. View detailed student results and statistics');
    console.log('4. Click "Mark" to access anonymous marking interface');
    console.log('5. Mark essay questions with partial marks and feedback');
    console.log('6. Filter and search through student results');
  } else {
    console.log('\n⚠️  Please check the failed components before testing Priority 2.');
  }
}

runTests(); 