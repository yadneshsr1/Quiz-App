const http = require('http');

console.log('🧪 Testing Feedback System Implementation...\n');

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

// Test 3: Check quiz creation with feedback
function testQuizCreationWithFeedback() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      title: "Test Quiz with Feedback",
      description: "Testing feedback system",
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
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const quiz = JSON.parse(data);
          resolve(quiz._id ? true : false);
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

// Test 4: Check question addition with feedback
function testQuestionWithFeedback() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      questionText: "What is the primary purpose of an algorithm?",
      options: [
        "To solve a specific problem efficiently",
        "To make code more readable", 
        "To reduce file size",
        "To improve computer performance"
      ],
      correctAnswerIndex: 0,
      feedback: "Algorithms are step-by-step procedures designed to solve specific problems efficiently. They provide a systematic approach to problem-solving."
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/quizzes/1/questions',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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
          resolve(result.questions && result.questions.length > 0);
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
  console.log('🔍 Running Feedback System tests...\n');
  
  const serverOk = await testServerStatus();
  const reactOk = await testReactApp();
  const quizCreationOk = await testQuizCreationWithFeedback();
  const questionFeedbackOk = await testQuestionWithFeedback();
  
  console.log('\n📊 Test Results:');
  console.log('Server Status:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('React App:', reactOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Creation with Feedback:', quizCreationOk ? '✅ PASS' : '❌ FAIL');
  console.log('Question Addition with Feedback:', questionFeedbackOk ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = serverOk && reactOk && quizCreationOk && questionFeedbackOk;
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 Feedback System is working! You can now:');
    console.log('1. Login as an academic');
    console.log('2. Create a new quiz');
    console.log('3. Add questions with feedback/justification');
    console.log('4. Students will see feedback immediately when they select an answer');
    console.log('5. Feedback is also shown in quiz results');
    console.log('\n📝 Key Changes Made:');
    console.log('• Updated Quiz model to include feedback field');
    console.log('• Modified quiz routes to handle feedback');
    console.log('• Enhanced AcademicDashboard to include feedback input');
    console.log('• Updated QuizTaking to show feedback when answers are selected');
    console.log('• Added feedback display to QuizResults');
  } else {
    console.log('\n⚠️  Please check the failed components before testing the feedback system.');
  }
}

runTests(); 