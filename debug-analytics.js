const http = require('http');

console.log('🔍 Debugging Analytics API...\n');

// Test 1: Login and get token
function login() {
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
          console.log('🔐 Login Response:');
          console.log('Status:', res.statusCode);
          console.log('Token:', result.token ? 'Present' : 'Missing');
          console.log('User:', result.user?.role);
          
          if (res.statusCode === 200 && result.token) {
            resolve(result.token);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Login parse error:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Login request failed');
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

// Test 2: Test analytics API with token
function testAnalytics(token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/results/quiz/6896c710bc1932238cdae28e/all',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n📊 Analytics API Response:');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        
        try {
          const result = JSON.parse(data);
          console.log('Response:', result);
          
          if (res.statusCode === 200) {
            console.log('✅ Analytics API working');
            resolve(true);
          } else {
            console.log('❌ Analytics API failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Parse error:', e.message);
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      resolve(false);
    });

    req.end();
  });
}

// Test 3: Test without authentication
function testAnalyticsNoAuth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/results/quiz/6896c710bc1932238cdae28e/all', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n📊 Analytics API (No Auth):');
        console.log('Status:', res.statusCode);
        
        try {
          const result = JSON.parse(data);
          console.log('Response:', result);
          resolve(res.statusCode === 401); // Should be 401
        } catch (e) {
          console.log('❌ Parse error:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Request failed');
      resolve(false);
    });
  });
}

async function runDebug() {
  console.log('🚀 Starting Analytics Debug...\n');
  
  // Step 1: Login
  const token = await login();
  if (!token) {
    console.log('\n❌ Cannot proceed without token');
    return;
  }
  
  // Step 2: Test with auth
  const authOk = await testAnalytics(token);
  
  // Step 3: Test without auth
  const noAuthOk = await testAnalyticsNoAuth();
  
  console.log('\n📊 Debug Results:');
  console.log('Login:', token ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics with Auth:', authOk ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics without Auth:', noAuthOk ? '✅ PASS (401 as expected)' : '❌ FAIL');
  
  if (authOk) {
    console.log('\n🎉 Analytics API is working!');
  } else {
    console.log('\n⚠️  Analytics API has issues. Check the response details above.');
  }
}

runDebug(); 