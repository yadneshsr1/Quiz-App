const http = require('http');

console.log('🧪 Testing Quiz Analytics Student Responses...\n');

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

// Test 2: Test quiz analytics API endpoint
function testAnalyticsAPI() {
  return new Promise((resolve) => {
    // First, get a token by logging in as academic
    const loginData = JSON.stringify({
      username: "academic",
      password: "password"
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginData = '';
      loginRes.on('data', (chunk) => loginData += chunk);
      loginRes.on('end', () => {
        try {
          const loginResult = JSON.parse(loginData);
          if (loginRes.statusCode === 200 && loginResult.token) {
            console.log('✅ Authentication successful');
            
            // Now test analytics API with token
            const analyticsOptions = {
              hostname: 'localhost',
              port: 5000,
              path: '/api/results/quiz/6896c710bc1932238cdae28e/all',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${loginResult.token}`
              }
            };

                        const analyticsReq = http.request(analyticsOptions, (res) => {
              let data = '';
              res.on('data', (chunk) => data += chunk);
              res.on('end', () => {
                try {
                  const results = JSON.parse(data);
                  console.log('\n📊 Quiz Analytics API Test:');
                  console.log('Status Code:', res.statusCode);
                  console.log('Results Count:', results.length);
                  
                  if (res.statusCode === 200 && results.length > 0) {
                    console.log('✅ Analytics API working');
                    
                    // Check if results have answers field
                    const hasAnswers = results.every(result => result.answers);
                    console.log('Has Answers Field:', hasAnswers ? '✅ YES' : '❌ NO');
                    
                    if (hasAnswers) {
                      console.log('Sample Answer Data:', Object.keys(results[0].answers));
                    }
                    
                    resolve(true);
                  } else {
                    console.log('❌ Analytics API failed or no results');
                    resolve(false);
                  }
                } catch (e) {
                  console.log('❌ Error parsing analytics response:', e.message);
                  resolve(false);
                }
              });
            });
            analyticsReq.on('error', () => {
              console.log('❌ Analytics API request failed');
              resolve(false);
            });
            analyticsReq.end();
          } else {
            console.log('❌ Authentication failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing login response:', e.message);
          resolve(false);
        }
      });
    });
    loginReq.on('error', () => {
      console.log('❌ Login request failed');
      resolve(false);
    });
    loginReq.write(loginData);
    loginReq.end();
  });
}

// Test 3: Test quiz fetch for analytics
function testQuizFetch() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/quizzes/6896c710bc1932238cdae28e', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const quiz = JSON.parse(data);
          console.log('\n📚 Quiz Fetch for Analytics:');
          console.log('Status Code:', res.statusCode);
          console.log('Quiz Title:', quiz.title);
          console.log('Questions Count:', quiz.questions?.length || 0);
          
          if (res.statusCode === 200 && quiz.questions && quiz.questions.length > 0) {
            console.log('✅ Quiz fetch working for analytics');
            console.log('Question IDs:', quiz.questions.map(q => q._id));
            resolve(true);
          } else {
            console.log('❌ Quiz fetch failed or no questions');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing quiz response:', e.message);
          resolve(false);
        }
      });
    });
    req.on('error', () => {
      console.log('❌ Quiz fetch request failed');
      resolve(false);
    });
  });
}

// Test 4: Test React app accessibility
function testReactApp() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('\n🌐 React App Test:');
      console.log('Status Code:', res.statusCode);
      
      if (res.statusCode === 200) {
        console.log('✅ React app is accessible');
        resolve(true);
      } else {
        console.log('❌ React app not accessible');
        resolve(false);
      }
    });
    req.on('error', () => {
      console.log('❌ React app not running');
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🔍 Running Analytics Response Tests...\n');
  
  // Step 1: Check server
  const serverOk = await checkServer();
  if (!serverOk) {
    console.log('\n❌ Cannot proceed - server not running');
    return;
  }
  
  // Step 2: Test analytics API
  const analyticsOk = await testAnalyticsAPI();
  
  // Step 3: Test quiz fetch
  const quizOk = await testQuizFetch();
  
  // Step 4: Test React app
  const reactOk = await testReactApp();
  
  console.log('\n📊 Final Analytics Results:');
  console.log('Server Health:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics API:', analyticsOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Fetch:', quizOk ? '✅ PASS' : '❌ FAIL');
  console.log('React App:', reactOk ? '✅ PASS' : '❌ FAIL');
  
  if (serverOk && analyticsOk && quizOk && reactOk) {
    console.log('\n🎉 Quiz Analytics is working perfectly!');
    console.log('\n💡 You can now:');
    console.log('1. Go to http://localhost:3000/academic');
    console.log('2. Click "View Analytics" on any quiz');
    console.log('3. Click "View Response" on any student result');
    console.log('4. See detailed question-by-question responses');
  } else {
    console.log('\n⚠️  Some analytics tests failed. Check the logs above for details.');
  }
}

runTests(); 