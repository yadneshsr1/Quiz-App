const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  username: 'student1',
  password: 'password123'
};

async function testPhotoEndpoint() {
  try {
    console.log('🧪 Testing Student Photo Endpoint...\n');
    
    // Step 1: Login to get JWT token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ Login successful, JWT token received\n');
    
    // Step 2: Test photo endpoint with valid token
    console.log('2. Testing /me/photo endpoint...');
    const photoResponse = await axios.get(`${BASE_URL}/auth/me/photo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Photo endpoint response:', photoResponse.data);
    
    // Step 3: Test without token (should fail)
    console.log('\n3. Testing /me/photo without token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/auth/me/photo`);
      console.log('❌ Expected 401 but got success');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected unauthorized request');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    console.log('\n🎉 Photo endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request made but no response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Full error:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testPhotoEndpoint();
}

module.exports = { testPhotoEndpoint };
