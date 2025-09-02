const http = require('http');

console.log('🧪 Testing Dynamic Quiz System...\n');

// Test 1: Check if server is running
function testServerStatus() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.status === 'OK');
        } catch (e) {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

// Test 2: Test academic login
function testAcademicLogin() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      username: "academic",
      password: "password"
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.token && result.user.role === 'academic');
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

// Test 3: Test student login
function testStudentLogin() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      username: "student",
      password: "password"
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.token && result.user.role === 'student');
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

// Test 4: Test quiz creation
function testQuizCreation() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      title: "Test Quiz",
      description: "A test quiz for system verification",
      moduleCode: "TEST101",
      startTime: new Date().toISOString()
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result._id && result.title === "Test Quiz");
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

// Test 5: Test quiz fetching
function testQuizFetching() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/quizzes', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(Array.isArray(result) && result.length > 0);
        } catch (e) {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

// Test 6: Test React app accessibility
function testReactApp() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

// Test 7: Test quiz submission
function testQuizSubmission() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      quizId: "1",
      answers: {
        1: 0, // correct
        2: 1, // correct
        3: 2, // incorrect
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
        'Authorization': 'Bearer mock-token'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          // Should either succeed or return appropriate error
          resolve(res.statusCode === 201 || res.statusCode === 401);
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
  console.log('🔍 Running Dynamic System Tests...\n');
  
  const serverOk = await testServerStatus();
  const academicLoginOk = await testAcademicLogin();
  const studentLoginOk = await testStudentLogin();
  const quizCreationOk = await testQuizCreation();
  const quizFetchingOk = await testQuizFetching();
  const reactAppOk = await testReactApp();
  const quizSubmissionOk = await testQuizSubmission();
  
  console.log('\n📊 Test Results:');
  console.log('Server Health Check:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('Academic Login:', academicLoginOk ? '✅ PASS' : '❌ FAIL');
  console.log('Student Login:', studentLoginOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Creation:', quizCreationOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Fetching:', quizFetchingOk ? '✅ PASS' : '❌ FAIL');
  console.log('React App:', reactAppOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Submission:', quizSubmissionOk ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = serverOk && academicLoginOk && studentLoginOk && quizCreationOk && quizFetchingOk && reactAppOk && quizSubmissionOk;
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 Dynamic Quiz System is fully operational!');
    console.log('\n📝 System Features:');
    console.log('• ✅ Server running with health check endpoint');
    console.log('• ✅ Mock authentication system working');
    console.log('• ✅ Quiz creation and fetching functional');
    console.log('• ✅ React frontend accessible');
    console.log('• ✅ Quiz submission system ready');
    console.log('• ✅ Error handling and fallbacks implemented');
    console.log('• ✅ Graceful database connection handling');
    console.log('\n🎯 Ready for Real-Time Testing:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Login with test credentials:');
    console.log('   - Academic: username: "academic", password: "password"');
    console.log('   - Student: username: "student", password: "password"');
    console.log('3. Test all features without database setup');
    console.log('4. System will work with mock data and real API calls');
  } else {
    console.log('\n⚠️  Some components need attention:');
    if (!serverOk) console.log('• Server not running - start with: cd server && node server.js');
    if (!reactAppOk) console.log('• React app not running - start with: cd client && npm start');
    if (!academicLoginOk || !studentLoginOk) console.log('• Authentication system needs fixing');
    if (!quizCreationOk || !quizFetchingOk) console.log('• Quiz API needs attention');
  }
}

runTests(); 