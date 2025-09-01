const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const ACADEMIC_USER = {
  username: 'academic1',
  password: 'password123'
};
const STUDENT_USER = {
  username: 'student1',
  password: 'password123'
};

async function testAcademicPhotoEndpoint() {
  try {
    console.log('🧪 Testing Academic Student Photo Endpoint...\n');
    
    // Step 1: Login as academic to get JWT token
    console.log('1. Logging in as academic...');
    const academicLoginResponse = await axios.post(`${BASE_URL}/auth/login`, ACADEMIC_USER);
    const academicToken = academicLoginResponse.data.token;
    console.log('✅ Academic login successful, JWT token received\n');
    
    // Step 2: Login as student to get student ID
    console.log('2. Logging in as student to get student ID...');
    const studentLoginResponse = await axios.post(`${BASE_URL}/auth/login`, STUDENT_USER);
    const studentToken = studentLoginResponse.data.token;
    const studentId = studentLoginResponse.data.user.id;
    console.log('✅ Student login successful, ID:', studentId, '\n');
    
    // Step 3: Test academic endpoint with valid academic token
    console.log('3. Testing /students/:id/photo endpoint with academic token...');
    const photoResponse = await axios.get(`${BASE_URL}/auth/students/${studentId}/photo`, {
      headers: { Authorization: `Bearer ${academicToken}` }
    });
    console.log('✅ Academic photo endpoint response:', photoResponse.data);
    
    // Step 4: Test with student token (should fail - role check)
    console.log('\n4. Testing /students/:id/photo with student token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/auth/students/${studentId}/photo`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      console.log('❌ Expected 403 but got success');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly rejected student access (insufficient permissions)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    // Step 5: Test without token (should fail - auth check)
    console.log('\n5. Testing /students/:id/photo without token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/auth/students/${studentId}/photo`);
      console.log('❌ Expected 401 but got success');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected unauthorized request');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    // Step 6: Test with invalid student ID
    console.log('\n6. Testing /students/:id/photo with invalid student ID...');
    try {
      await axios.get(`${BASE_URL}/auth/students/invalid-id/photo`, {
        headers: { Authorization: `Bearer ${academicToken}` }
      });
      console.log('❌ Expected 404 but got success');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for invalid student ID');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    console.log('\n🎉 Academic photo endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request made but no response received');
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAcademicPhotoEndpoint();
}

module.exports = { testAcademicPhotoEndpoint };
