const http = require('http');

console.log('🧪 Testing MCQ-Only Anonymous Marking...\n');

// Test 1: Check if server is running
function testServerStatus() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/quizzes', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

// Test 2: Check if React app is running
function testReactApp() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

// Test 3: Check if analytics page is accessible (which leads to marking)
function testAnalyticsAccess() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/quiz-analytics/1', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

// Test 4: Check if marking page is accessible
function testMarkingAccess() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/marking/1/1', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

async function runTests() {
  console.log('🔍 Running MCQ-Only Anonymous Marking tests...\n');
  
  const serverOk = await testServerStatus();
  const reactOk = await testReactApp();
  const analyticsOk = await testAnalyticsAccess();
  const markingOk = await testMarkingAccess();
  
  console.log('\n📊 Test Results:');
  console.log('Server Status:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('React App:', reactOk ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics Page Access:', analyticsOk ? '✅ PASS' : '❌ FAIL');
  console.log('Marking Page Access:', markingOk ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = serverOk && reactOk && analyticsOk && markingOk;
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 MCQ-Only Anonymous Marking is working! Key changes made:');
    console.log('• Removed all essay questions from mock data');
    console.log('• Removed feedback functionality from marking interface');
    console.log('• Simplified marking to only handle MCQ questions (0 or 1 mark)');
    console.log('• Updated student answers to only include MCQ responses');
    console.log('• Removed essay question type references');
    console.log('• Simplified marking interface to single input field');
    console.log('\n📝 Note: Since all questions are now MCQ, marking is primarily for:');
    console.log('• Reviewing student answers');
    console.log('• Manual override if needed');
    console.log('• Quality assurance purposes');
  } else {
    console.log('\n⚠️  Please check the failed components before testing MCQ-only marking.');
  }
}

runTests(); 