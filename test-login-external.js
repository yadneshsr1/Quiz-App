const axios = require('axios');

const SERVER_URL = 'http://143.167.178.160:5000';

async function testExternalLogin() {
  console.log('🧪 Testing External Login...');
  
  try {
    // Test 1: Check if server is accessible
    console.log('1. Testing server accessibility...');
    const healthResponse = await axios.get(`${SERVER_URL}/api/auth/feature-flags`);
    console.log('✅ Server is accessible');
    
    // Test 2: Test login with valid credentials
    console.log('2. Testing login with valid credentials...');
    const loginResponse = await axios.post(`${SERVER_URL}/api/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Login successful');
      console.log('   User:', loginResponse.data.user.username);
      console.log('   Role:', loginResponse.data.user.role);
      
      // Test 3: Test authenticated endpoint
      console.log('3. Testing authenticated endpoint...');
      const meResponse = await axios.get(`${SERVER_URL}/api/auth/me/photo`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      console.log('✅ Authenticated endpoint works');
      console.log('   Photo data:', meResponse.data);
      
    } else {
      console.log('❌ Login failed - no token received');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

testExternalLogin();
