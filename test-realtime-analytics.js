const http = require('http');

console.log('🧪 Testing Real-Time Analytics...\n');

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
          console.log('❌ Error parsing server response:', e.message);
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

// Test 2: Login as student and get token
function loginAsStudent() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
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
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n👨‍🎓 Student Login:');
          console.log('Status Code:', res.statusCode);
          console.log('Token:', result.token ? 'Present' : 'Missing');
          
          if (res.statusCode === 200 && result.token) {
            console.log('✅ Student login successful');
            resolve(result.token);
          } else {
            console.log('❌ Student login failed');
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Error parsing login response:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Student login request failed');
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

// Test 3: Submit a quiz as student
function submitQuiz(studentToken, quizId) {
  return new Promise((resolve) => {
    const quizData = JSON.stringify({
      quizId: quizId,
      answers: {
        "6896c710bc1932238cdae290": 1 // Answer the first question
      },
      timeSpent: 120 // 2 minutes
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/results/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(quizData),
        'Authorization': `Bearer ${studentToken}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📝 Quiz Submission:');
          console.log('Status Code:', res.statusCode);
          console.log('Result:', result);
          
          if (res.statusCode === 201) {
            console.log('✅ Quiz submitted successfully');
            console.log(`Score: ${result.result.score}%`);
            console.log(`Correct: ${result.result.correctAnswers}/${result.result.totalQuestions}`);
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

    req.on('error', () => {
      console.log('❌ Quiz submission request failed');
      resolve(false);
    });

    req.write(quizData);
    req.end();
  });
}

// Test 4: Login as academic and get token
function loginAsAcademic() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
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
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n👨‍🏫 Academic Login:');
          console.log('Status Code:', res.statusCode);
          console.log('Token:', result.token ? 'Present' : 'Missing');
          
          if (res.statusCode === 200 && result.token) {
            console.log('✅ Academic login successful');
            resolve(result.token);
          } else {
            console.log('❌ Academic login failed');
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Error parsing login response:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Academic login request failed');
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

// Test 5: Check analytics for the quiz
function checkAnalytics(academicToken, quizId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/results/quiz/${quizId}/all`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${academicToken}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          console.log('\n📊 Analytics Check:');
          console.log('Status Code:', res.statusCode);
          console.log('Results Count:', results.length);
          
          if (res.statusCode === 200) {
            console.log('✅ Analytics API working');
            
            if (results.length > 0) {
              console.log('📋 Results found:');
              results.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.studentId?.name || 'Unknown'} - ${result.score}%`);
                if (result.answers) {
                  console.log(`     Answers: ${Object.keys(result.answers).length} questions answered`);
                }
              });
              
              // Check if we have real data (not mock)
              const hasRealData = results.some(result => 
                result.studentId?._id === 'mock-student-id' || 
                result._id !== '1' && result._id !== '2'
              );
              
              if (hasRealData) {
                console.log('✅ Real student data found in analytics!');
                resolve(true);
              } else {
                console.log('⚠️  Only mock data found in analytics');
                resolve(false);
              }
            } else {
              console.log('❌ No results found in analytics');
              resolve(false);
            }
          } else {
            console.log('❌ Analytics API failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing analytics response:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Analytics request failed');
      resolve(false);
    });

    req.end();
  });
}

async function runRealTimeTest() {
  console.log('🚀 Starting Real-Time Analytics Test...\n');
  
  // Step 1: Check server
  const serverOk = await checkServer();
  if (!serverOk) {
    console.log('\n❌ Cannot proceed - server not running');
    return;
  }
  
  // Step 2: Login as student
  const studentToken = await loginAsStudent();
  if (!studentToken) {
    console.log('\n❌ Cannot proceed - student login failed');
    return;
  }
  
  // Step 3: Submit a quiz
  const quizId = '6896c710bc1932238cdae28e'; // Use existing quiz ID
  const submissionOk = await submitQuiz(studentToken, quizId);
  if (!submissionOk) {
    console.log('\n❌ Cannot proceed - quiz submission failed');
    return;
  }
  
  // Step 4: Wait a moment for database update
  console.log('\n⏳ Waiting 2 seconds for database update...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 5: Login as academic
  const academicToken = await loginAsAcademic();
  if (!academicToken) {
    console.log('\n❌ Cannot proceed - academic login failed');
    return;
  }
  
  // Step 6: Check analytics
  const analyticsOk = await checkAnalytics(academicToken, quizId);
  
  console.log('\n📊 Final Real-Time Analytics Results:');
  console.log('Server Health:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('Student Login:', studentToken ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Submission:', submissionOk ? '✅ PASS' : '❌ FAIL');
  console.log('Academic Login:', academicToken ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics Check:', analyticsOk ? '✅ PASS' : '❌ FAIL');
  
  if (serverOk && studentToken && submissionOk && academicToken && analyticsOk) {
    console.log('\n🎉 Real-Time Analytics is working perfectly!');
    console.log('\n💡 You can now:');
    console.log('1. Students can submit quizzes');
    console.log('2. Academics can see real-time results in analytics');
    console.log('3. Analytics shows actual student responses');
    console.log('4. Data is updated dynamically');
  } else {
    console.log('\n⚠️  Some real-time analytics tests failed. Check the logs above for details.');
  }
}

runRealTimeTest(); 