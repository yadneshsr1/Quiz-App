const http = require('http');

console.log('🧪 Testing Frontend-Backend Integration...\n');

// Test 1: Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('🏥 Server Health Check:');
          console.log('Status Code:', res.statusCode);
          console.log('Response:', result.message);
          
          if (res.statusCode === 200) {
            console.log('✅ Server is running');
            resolve(true);
          } else {
            console.log('❌ Server health check failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Server health check failed:', e.message);
          resolve(false);
        }
      });
    });
    req.on('error', () => {
      console.log('❌ Server is not running');
      resolve(false);
    });
  });
}

// Test 2: Create a quiz for testing
function createTestQuiz() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      title: "Frontend Integration Test Quiz",
      description: "Testing frontend-backend integration",
      moduleCode: "INT101",
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
          console.log('\n📝 Test Quiz Creation:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz ID:', result._id);
          
          if (res.statusCode === 201 && result._id) {
            console.log('✅ Test quiz created successfully!');
            resolve(result._id);
          } else {
            console.log('❌ Test quiz creation failed');
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Error parsing quiz creation response:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Quiz creation request error:', err.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Add a question to the test quiz
function addTestQuestion(quizId) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      questionText: "What is 1 + 1?",
      options: ["1", "2", "3", "4"],
      correctAnswerIndex: 1,
      feedback: "1 + 1 = 2"
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quizzes/${quizId}/questions`,
      method: 'PATCH',
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
          console.log('\n❓ Test Question Addition:');
          console.log('Status Code:', res.statusCode);
          console.log('Questions Count:', result.questions?.length || 0);
          
          if (res.statusCode === 200 && result.questions && result.questions.length > 0) {
            console.log('✅ Test question added successfully!');
            console.log('Question ID:', result.questions[result.questions.length - 1]._id);
            resolve(result.questions[result.questions.length - 1]._id);
          } else {
            console.log('❌ Test question addition failed');
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Error parsing question addition response:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Question addition request error:', err.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// Test 4: Simulate frontend quiz fetch
function simulateFrontendFetch(quizId) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000/api/quizzes/${quizId}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n🌐 Frontend Quiz Fetch Simulation:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz Title:', result.title);
          console.log('Questions Count:', result.questions?.length || 0);
          
          if (res.statusCode === 200 && result.questions && result.questions.length > 0) {
            console.log('✅ Frontend fetch simulation successful!');
            console.log('Question IDs:', result.questions.map(q => q._id));
            resolve(result);
          } else {
            console.log('❌ Frontend fetch simulation failed');
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Error parsing frontend fetch response:', e.message);
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
  });
}

// Test 5: Simulate frontend quiz submission
function simulateFrontendSubmission(quizId, questionId) {
  return new Promise((resolve) => {
    const answers = {};
    answers[questionId] = 1; // Correct answer (index 1 = "2")
    
    const postData = JSON.stringify({
      quizId: quizId,
      answers: answers,
      timeSpent: 120
    });

    console.log('\n📊 Frontend Submission Simulation:');
    console.log('Submitting with answers:', answers);

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
          console.log('\n📊 Frontend Submission Result:');
          console.log('Status Code:', res.statusCode);
          
          if (res.statusCode === 201 && result.result) {
            console.log('✅ Frontend submission simulation successful!');
            console.log(`Score: ${result.result.score}%`);
            console.log(`Correct Answers: ${result.result.correctAnswers}/${result.result.totalQuestions}`);
            
            if (result.result.score === 100) {
              console.log('✅ Scoring is working correctly!');
              resolve(true);
            } else {
              console.log('❌ Scoring is incorrect!');
              resolve(false);
            }
          } else {
            console.log('❌ Frontend submission simulation failed');
            console.log('Response:', result);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing submission response:', e.message);
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Frontend submission request error:', err.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Running Frontend-Backend Integration Tests...\n');
  
  // Step 1: Check server
  const serverOk = await checkServer();
  if (!serverOk) {
    console.log('\n❌ Cannot proceed without server running');
    return;
  }
  
  // Step 2: Create test quiz
  const quizId = await createTestQuiz();
  if (!quizId) {
    console.log('\n❌ Cannot proceed without creating test quiz');
    return;
  }
  
  // Step 3: Add test question
  const questionId = await addTestQuestion(quizId);
  if (!questionId) {
    console.log('\n❌ Cannot proceed without adding test question');
    return;
  }
  
  // Step 4: Simulate frontend fetch
  const quizData = await simulateFrontendFetch(quizId);
  if (!quizData) {
    console.log('\n❌ Cannot proceed without successful frontend fetch');
    return;
  }
  
  // Step 5: Simulate frontend submission
  const submissionOk = await simulateFrontendSubmission(quizId, questionId);
  
  console.log('\n📊 Final Integration Results:');
  console.log('Server Health:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Creation:', quizId ? '✅ PASS' : '❌ FAIL');
  console.log('Question Addition:', questionId ? '✅ PASS' : '❌ FAIL');
  console.log('Frontend Fetch:', quizData ? '✅ PASS' : '❌ FAIL');
  console.log('Frontend Submission:', submissionOk ? '✅ PASS' : '❌ FAIL');
  
  if (serverOk && quizId && questionId && quizData && submissionOk) {
    console.log('\n🎉 Frontend-Backend integration is working perfectly!');
    console.log('\n💡 The system now properly:');
    console.log('• Server responds to health checks');
    console.log('• Quizzes can be created via API');
    console.log('• Questions can be added to quizzes');
    console.log('• Frontend can fetch quiz data');
    console.log('• Frontend can submit quiz answers');
    console.log('• Scoring works correctly');
  } else {
    console.log('\n⚠️  Some integration tests failed. Check the logs above for details.');
  }
}

runTests(); 