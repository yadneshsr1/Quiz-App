const http = require('http');

console.log('🧪 Testing CRUD Operations...\n');

// Test 1: Create a quiz
function createQuiz() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      title: "CRUD Test Quiz",
      description: "Testing CRUD operations",
      moduleCode: "CRUD101",
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
          console.log('📝 Quiz Creation:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz ID:', result._id);
          
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

// Test 2: Add questions to the quiz
function addQuestions(quizId) {
  const questions = [
    {
      questionText: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswerIndex: 1,
      feedback: "2 + 2 = 4"
    },
    {
      questionText: "What is the capital of England?",
      options: ["Manchester", "London", "Birmingham", "Liverpool"],
      correctAnswerIndex: 1,
      feedback: "London is the capital of England"
    }
  ];

  return Promise.all(questions.map((question, index) => {
    return new Promise((resolve) => {
      const postData = JSON.stringify(question);

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
            console.log(`❓ Question ${index + 1} Addition:`);
            console.log('Status Code:', res.statusCode);
            console.log('Questions Count:', result.questions?.length || 0);
            
            if (res.statusCode === 200 && result.questions) {
              console.log(`✅ Question ${index + 1} added successfully!`);
              resolve(true);
            } else {
              console.log(`❌ Question ${index + 1} addition failed`);
              resolve(false);
            }
          } catch (e) {
            console.log(`❌ Error parsing question ${index + 1} response:`, e.message);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        console.log(`❌ Question ${index + 1} request error:`, err.message);
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }));
}

// Test 3: Retrieve the quiz
function retrieveQuiz(quizId) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000/api/quizzes/${quizId}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📚 Quiz Retrieval:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz Title:', result.title);
          console.log('Questions Count:', result.questions?.length || 0);
          
          if (res.statusCode === 200 && result.questions && result.questions.length >= 2) {
            console.log('✅ Quiz retrieved successfully!');
            console.log('Questions:');
            result.questions.forEach((q, index) => {
              console.log(`  ${index + 1}. ${q.questionText} (ID: ${q._id})`);
            });
            resolve(result.questions);
          } else {
            console.log('❌ Quiz retrieval failed or insufficient questions');
            resolve([]);
          }
        } catch (e) {
          console.log('❌ Error parsing quiz retrieval response:', e.message);
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
  });
}

// Test 4: Submit quiz with correct answers
function submitQuiz(quizId, questions) {
  return new Promise((resolve) => {
    // Create answers object using question IDs
    const answers = {};
    questions.forEach((question, index) => {
      answers[question._id] = question.correctAnswerIndex;
    });

    const postData = JSON.stringify({
      quizId: quizId,
      answers: answers,
      timeSpent: 120
    });

    console.log('\n📊 Submitting quiz with answers:', answers);

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
          console.log('\n📊 Quiz Submission:');
          console.log('Status Code:', res.statusCode);
          
          if (res.statusCode === 201 && result.result) {
            console.log('✅ Quiz submitted successfully!');
            console.log(`Score: ${result.result.score}%`);
            console.log(`Correct Answers: ${result.result.correctAnswers}/${result.result.totalQuestions}`);
            
            // Check if scoring is correct
            if (result.result.score === 100 && result.result.correctAnswers === questions.length) {
              console.log('✅ Scoring is working correctly!');
              resolve(true);
            } else {
              console.log('❌ Scoring is incorrect!');
              resolve(false);
            }
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
  console.log('🔍 Running CRUD Operations Tests...\n');
  
  // Step 1: Create quiz
  const quizId = await createQuiz();
  if (!quizId) {
    console.log('\n❌ Cannot proceed without creating a quiz');
    return;
  }
  
  // Step 2: Add questions
  const questionsAdded = await addQuestions(quizId);
  const allQuestionsAdded = questionsAdded.every(result => result === true);
  if (!allQuestionsAdded) {
    console.log('\n❌ Cannot proceed without adding all questions');
    return;
  }
  
  // Step 3: Retrieve quiz
  const questions = await retrieveQuiz(quizId);
  if (questions.length < 2) {
    console.log('\n❌ Cannot proceed without retrieving questions');
    return;
  }
  
  // Step 4: Submit quiz
  const submissionOk = await submitQuiz(quizId, questions);
  
  console.log('\n📊 Final CRUD Results:');
  console.log('Quiz Creation:', quizId ? '✅ PASS' : '❌ FAIL');
  console.log('Question Addition:', allQuestionsAdded ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Retrieval:', questions.length >= 2 ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Submission:', submissionOk ? '✅ PASS' : '❌ FAIL');
  
  if (quizId && allQuestionsAdded && questions.length >= 2 && submissionOk) {
    console.log('\n🎉 All CRUD operations are working correctly!');
    console.log('\n💡 The system now properly:');
    console.log('• Creates quizzes (CREATE)');
    console.log('• Adds questions to quizzes (CREATE)');
    console.log('• Retrieves quizzes with questions (READ)');
    console.log('• Submits and scores quizzes correctly (CREATE)');
  } else {
    console.log('\n⚠️  Some CRUD operations failed. Check the server logs for details.');
  }
}

runTests(); 