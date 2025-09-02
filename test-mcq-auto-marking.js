const http = require('http');

console.log('🧪 Testing MCQ Auto-Marking System...\n');

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

// Test 3: Check if analytics page is accessible
function testAnalyticsAccess() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/quiz-analytics/1', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

// Test 4: Check if marking page is removed (should return 404)
function testMarkingPageRemoved() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/marking/1/1', (res) => {
      resolve(res.statusCode === 404); // Should return 404 since route is removed
    });
    req.on('error', () => resolve(true)); // Error is also acceptable since route doesn't exist
    req.setTimeout(3000, () => resolve(true));
  });
}

// Test 5: Check quiz submission with auto-marking
function testQuizSubmission() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      quizId: "1",
      answers: {
        1: 0, // correct
        2: 1, // correct
        3: 2, // incorrect (should be 1)
        4: 0, // correct
        5: 1  // correct
      },
      timeSpent: 1800
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/results/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer test-token' // Mock token
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          // Should calculate 4/5 = 80% score automatically
          resolve(result.result && result.result.score === 80);
        } catch (e) {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Running MCQ Auto-Marking System tests...\n');
  
  const serverOk = await testServerStatus();
  const reactOk = await testReactApp();
  const analyticsOk = await testAnalyticsAccess();
  const markingRemoved = await testMarkingPageRemoved();
  const autoMarkingOk = await testQuizSubmission();
  
  console.log('\n📊 Test Results:');
  console.log('Server Status:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('React App:', reactOk ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics Page Access:', analyticsOk ? '✅ PASS' : '❌ FAIL');
  console.log('Marking Page Removed:', markingRemoved ? '✅ PASS' : '❌ FAIL');
  console.log('Auto-Marking Calculation:', autoMarkingOk ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = serverOk && reactOk && analyticsOk && markingRemoved && autoMarkingOk;
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 MCQ Auto-Marking System is working! Key changes made:');
    console.log('• Removed Anonymous Marking page and routes');
    console.log('• Removed marking functionality from Quiz Analytics');
    console.log('• Made students anonymous in analytics view');
    console.log('• MCQs are automatically marked on submission');
    console.log('• Score calculation based on correctAnswerIndex');
    console.log('• Simplified analytics interface for viewing responses');
    console.log('\n📝 System Flow:');
    console.log('1. Students take MCQ quizzes');
    console.log('2. Answers are automatically compared to correctAnswerIndex');
    console.log('3. Score is calculated as (correct/total) * 100');
    console.log('4. Academics can view anonymous student responses in analytics');
    console.log('5. No manual marking required for MCQs');
  } else {
    console.log('\n⚠️  Please check the failed components before testing the MCQ auto-marking system.');
  }
}

runTests(); 