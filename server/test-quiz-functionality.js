const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testQuizFunctionality() {
  console.log('🧪 Testing Quiz Functionality...\n');

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

    // Get available quizzes
    console.log('\n2. Getting available quizzes...');
    const quizzesResponse = await axios.get(`${BASE_URL}/quizzes`, { headers });
    
    if (quizzesResponse.data && quizzesResponse.data.length > 0) {
      console.log(`✅ Found ${quizzesResponse.data.length} available quizzes`);
      
      // Test getting a specific quiz
      const quizId = quizzesResponse.data[0]._id;
      console.log(`\n3. Getting quiz details for quiz: ${quizId}...`);
      
      const quizResponse = await axios.get(`${BASE_URL}/quizzes/${quizId}`, { headers });
      
      if (quizResponse.data) {
        console.log(`✅ Quiz details retrieved: ${quizResponse.data.title}`);
        console.log(`   Questions: ${quizResponse.data.questions ? quizResponse.data.questions.length : 0}`);
      } else {
        console.log('❌ Failed to get quiz details');
      }
    } else {
      console.log('❌ No quizzes found');
    }

    console.log('\n🎉 Quiz functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testQuizFunctionality();
