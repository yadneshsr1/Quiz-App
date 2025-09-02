const http = require('http');

console.log('🧪 Testing Question Flow (Create → Add Questions → Retrieve)...\n');

// Test 1: Create a new quiz
function createQuiz() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      title: "Test Quiz for Question Flow",
      description: "A test quiz to verify question addition and retrieval",
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
          console.log('📝 Quiz Creation Response:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz ID:', result._id);
          console.log('Title:', result.title);
          console.log('Questions Count:', result.questions?.length || 0);
          
          if (res.statusCode === 201 && result._id) {
            console.log('✅ Quiz created successfully!');
            resolve(result._id);
          } else {
            console.log('❌ Quiz creation failed');
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

// Test 2: Add a question to the quiz
function addQuestion(quizId) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      questionText: "What is the capital of France?",
      options: [
        "London",
        "Paris",
        "Berlin",
        "Madrid"
      ],
      correctAnswerIndex: 1,
      feedback: "Paris is the capital and largest city of France."
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
          console.log('\n❓ Question Addition Response:');
          console.log('Status Code:', res.statusCode);
          console.log('Questions Count:', result.questions?.length || 0);
          
          if (res.statusCode === 200 && result.questions && result.questions.length > 0) {
            console.log('✅ Question added successfully!');
            console.log('Latest Question:', result.questions[result.questions.length - 1].questionText);
            resolve(true);
          } else {
            console.log('❌ Question addition failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing question addition response:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Question addition request error:', err.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Retrieve the quiz and verify questions
function retrieveQuiz(quizId) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000/api/quizzes/${quizId}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📚 Quiz Retrieval Response:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz Title:', result.title);
          console.log('Questions Count:', result.questions?.length || 0);
          
          if (res.statusCode === 200 && result.questions && result.questions.length > 0) {
            console.log('✅ Quiz retrieved successfully!');
            console.log('Questions:');
            result.questions.forEach((q, index) => {
              console.log(`  ${index + 1}. ${q.questionText}`);
            });
            resolve(true);
          } else {
            console.log('❌ Quiz retrieval failed or no questions found');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing quiz retrieval response:', e.message);
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
  });
}

// Test 4: Submit quiz with answers
function submitQuiz(quizId) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      quizId: quizId,
      answers: {
        "1": 1 // Correct answer for the question we added
      },
      timeSpent: 60
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
          console.log('\n📊 Quiz Submission Response:');
          console.log('Status Code:', res.statusCode);
          
          if (res.statusCode === 201 && result.result) {
            console.log('✅ Quiz submitted successfully!');
            console.log(`Score: ${result.result.score}%`);
            console.log(`Correct Answers: ${result.result.correctAnswers}/${result.result.totalQuestions}`);
            resolve(true);
          } else {
            console.log('❌ Quiz submission failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing submission response:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Quiz submission request error:', err.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Running Complete Question Flow Tests...\n');
  
  // Step 1: Create quiz
  const quizId = await createQuiz();
  if (!quizId) {
    console.log('\n❌ Cannot proceed without creating a quiz');
    return;
  }
  
  // Step 2: Add question
  const questionAdded = await addQuestion(quizId);
  if (!questionAdded) {
    console.log('\n❌ Cannot proceed without adding a question');
    return;
  }
  
  // Step 3: Retrieve quiz
  const quizRetrieved = await retrieveQuiz(quizId);
  if (!quizRetrieved) {
    console.log('\n❌ Cannot proceed without retrieving the quiz');
    return;
  }
  
  // Step 4: Submit quiz
  const quizSubmitted = await submitQuiz(quizId);
  
  console.log('\n📊 Final Results:');
  console.log('Quiz Creation:', quizId ? '✅ PASS' : '❌ FAIL');
  console.log('Question Addition:', questionAdded ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Retrieval:', quizRetrieved ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Submission:', quizSubmitted ? '✅ PASS' : '❌ FAIL');
  
  if (quizId && questionAdded && quizRetrieved && quizSubmitted) {
    console.log('\n🎉 Complete question flow is working!');
    console.log('\n💡 The system now properly:');
    console.log('• Creates quizzes in the database');
    console.log('• Adds questions to quizzes');
    console.log('• Retrieves quizzes with all questions');
    console.log('• Submits and scores quizzes correctly');
  } else {
    console.log('\n⚠️  Some steps failed. Check the server logs for details.');
  }
}

runTests(); 