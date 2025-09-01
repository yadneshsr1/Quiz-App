const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFeatureFlag() {
  console.log('🧪 Testing Feature Flag Behavior...\n');

  try {
    // Login as student
    console.log('1. Logging in as student...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Student login successful');

    // Test photo endpoint with feature flag enabled
    console.log('\n2. Testing photo endpoint (feature flag should be enabled)...');
    try {
      const photoResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { headers });
      
      if (photoResponse.data && photoResponse.data.photoUrl) {
        console.log('✅ Photo endpoint accessible (feature flag enabled)');
        console.log(`   Photo URL: ${photoResponse.data.photoUrl}`);
      } else {
        console.log('❌ Photo endpoint returned no data');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('❌ Photo endpoint not found (feature flag may be disabled)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test academic photo endpoint
    console.log('\n3. Testing academic photo endpoint...');
    try {
      const academicPhotoResponse = await axios.get(`${BASE_URL}/auth/students/68b089a8eb8d070702ab0708/photo`, { headers });
      
      if (academicPhotoResponse.data) {
        console.log('✅ Academic photo endpoint accessible');
        console.log(`   Student: ${academicPhotoResponse.data.studentName}`);
        console.log(`   Reg No: ${academicPhotoResponse.data.regNo}`);
      } else {
        console.log('❌ Academic photo endpoint returned no data');
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Academic photo endpoint correctly rejected student access');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 Feature flag test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFeatureFlag();
