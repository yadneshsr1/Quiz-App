const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testBasicAuth() {
  console.log('🧪 Testing Basic Authentication...\n');

  try {
    // Test student login
    console.log('1. Testing student login...');
    const studentResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    
    if (studentResponse.data.token) {
      console.log('✅ Student login successful');
    } else {
      console.log('❌ Student login failed');
    }

    // Test academic login
    console.log('\n2. Testing academic login...');
    const academicResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });
    
    if (academicResponse.data.token) {
      console.log('✅ Academic login successful');
    } else {
      console.log('❌ Academic login failed');
    }

    // Test invalid login
    console.log('\n3. Testing invalid login...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        username: 'invalid',
        password: 'wrong'
      });
      console.log('❌ Invalid login should have failed');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid login correctly rejected');
      } else {
        console.log('❌ Unexpected error for invalid login');
      }
    }

    console.log('\n🎉 Basic authentication test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicAuth();
