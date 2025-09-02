const http = require('http');

console.log('🧪 Testing Quiz Submission...\n');

// Test quiz submission
function testQuizSubmission() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      quizId: "1",
      answers: {
        "1": 1, // correct answer for question 1
        "2": 2, // correct answer for question 2
        "3": 1, // correct answer for question 3
        "4": 1, // correct answer for question 4
        "5": 1  // correct answer for question 5
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
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📊 Quiz Submission Response:');
          console.log('Status Code:', res.statusCode);
          console.log('Response:', JSON.stringify(result, null, 2));
          
          if (res.statusCode === 201 && result.result) {
            console.log('✅ Quiz submission successful!');
            console.log(`Score: ${result.result.score}%`);
            console.log(`Correct Answers: ${result.result.correctAnswers}/${result.result.totalQuestions}`);
            resolve(true);
          } else {
            console.log('❌ Quiz submission failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing response:', e.message);
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test quiz fetching
function testQuizFetching() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/quizzes/1', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📚 Quiz Fetching Response:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz Title:', result.title);
          console.log('Questions Count:', result.questions?.length || 0);
          
          if (res.statusCode === 200 && result.questions) {
            console.log('✅ Quiz fetching successful!');
            resolve(true);
          } else {
            console.log('❌ Quiz fetching failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing quiz response:', e.message);
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
  });
}

// Test server health
function testServerHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('🏥 Server Health Check:');
          console.log('Status Code:', res.statusCode);
          console.log('Response:', result);
          
          if (res.statusCode === 200 && result.status === 'OK') {
            console.log('✅ Server is healthy!');
            resolve(true);
          } else {
            console.log('❌ Server health check failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing health response:', e.message);
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
  });
}

async function runTests() {
  console.log('🔍 Running Quiz Submission Tests...\n');
  
  const serverOk = await testServerHealth();
  if (!serverOk) {
    console.log('\n❌ Server is not running. Please start the server first.');
    return;
  }
  
  const quizFetchOk = await testQuizFetching();
  const submissionOk = await testQuizSubmission();
  
  console.log('\n📊 Final Results:');
  console.log('Server Health:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Fetching:', quizFetchOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Submission:', submissionOk ? '✅ PASS' : '❌ FAIL');
  
  if (serverOk && quizFetchOk && submissionOk) {
    console.log('\n🎉 All tests passed! Quiz system is working properly.');
    console.log('\n💡 You can now:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Login as student: username: "student", password: "password"');
    console.log('3. Start a quiz and submit it successfully');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server logs for more details.');
  }
}

runTests(); 