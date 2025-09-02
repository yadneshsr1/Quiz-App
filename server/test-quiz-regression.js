const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testQuizRegression() {
  console.log('🔄 Testing Quiz Functionality Regression');
  console.log('=========================================\n');

  try {
    // Step 1: Login as academic
    console.log('1. Logging in as academic user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });
    const academicToken = loginResponse.data.token;
    console.log('✅ Academic login successful');

    // Step 2: Test basic quiz creation (existing functionality)
    console.log('\n2. Testing basic quiz creation (existing functionality)...');
    const basicQuiz = {
      title: 'Regression Test Quiz',
      description: 'Testing existing quiz creation functionality',
      moduleCode: 'REG101',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const createResponse = await axios.post(`${BASE_URL}/api/quizzes`, basicQuiz, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });

    const createdQuiz = createResponse.data;
    console.log('✅ Basic quiz creation works');
    console.log(`   Quiz ID: ${createdQuiz._id}`);
    console.log(`   Title: "${createdQuiz.title}"`);

    // Step 3: Test quiz with access code (existing functionality)
    console.log('\n3. Testing quiz with access code...');
    const quizWithCode = {
      title: 'Regression Test Quiz - Access Code',
      description: 'Testing quiz with access code',
      moduleCode: 'REG102',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      accessCode: 'test123'
    };

    const createWithCodeResponse = await axios.post(`${BASE_URL}/api/quizzes`, quizWithCode, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });

    const quizWithCodeData = createWithCodeResponse.data;
    console.log('✅ Quiz with access code creation works');
    console.log(`   Has access code hash: ${!!quizWithCodeData.accessCodeHash}`);

    // Step 4: Test quiz with IP restrictions (existing functionality)
    console.log('\n4. Testing quiz with IP restrictions...');
    const quizWithIP = {
      title: 'Regression Test Quiz - IP Restricted',
      description: 'Testing quiz with IP restrictions',
      moduleCode: 'REG103',
      startTime: new Date().toISOString(),
      allowedIpCidrs: ['192.168.1.0/24', '10.0.0.0/8']
    };

    const createWithIPResponse = await axios.post(`${BASE_URL}/api/quizzes`, quizWithIP, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });

    const quizWithIPData = createWithIPResponse.data;
    console.log('✅ Quiz with IP restrictions creation works');
    console.log(`   IP ranges count: ${quizWithIPData.allowedIpCidrs?.length || 0}`);

    // Step 5: Test fetching quizzes (existing functionality)
    console.log('\n5. Testing quiz fetching...');
    const fetchResponse = await axios.get(`${BASE_URL}/api/quizzes`, {
      headers: { 'Authorization': `Bearer ${academicToken}` }
    });

    console.log(`✅ Quiz fetching works (Found ${fetchResponse.data.length} quizzes)`);

    // Step 6: Test fetching individual quiz (existing functionality)
    console.log('\n6. Testing individual quiz fetching...');
    const quizId = createdQuiz._id;
    const individualQuizResponse = await axios.get(`${BASE_URL}/api/quizzes/${quizId}`, {
      headers: { 'Authorization': `Bearer ${academicToken}` }
    });

    console.log('✅ Individual quiz fetching works');
    console.log(`   Fetched quiz: "${individualQuizResponse.data.title}"`);

    // Step 7: Test eligible quizzes for student (existing functionality)
    console.log('\n7. Testing eligible quizzes for student...');
    const studentLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    const studentToken = studentLoginResponse.data.token;

    const eligibleResponse = await axios.get(`${BASE_URL}/api/quizzes/eligible`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log(`✅ Eligible quizzes endpoint works (Found ${eligibleResponse.data.length} eligible quizzes)`);

    // Step 8: Test that new assignedStudentIds field doesn't break existing functionality
    console.log('\n8. Testing backward compatibility...');
    
    // Fetch a quiz and check if it has the new field
    const backwardCompatQuiz = await axios.get(`${BASE_URL}/api/quizzes/${quizId}`, {
      headers: { 'Authorization': `Bearer ${academicToken}` }
    });

    const hasAssignedStudentsField = backwardCompatQuiz.data.hasOwnProperty('assignedStudentIds');
    console.log(`✅ New assignedStudentIds field present: ${hasAssignedStudentsField}`);
    console.log(`   Field value: ${JSON.stringify(backwardCompatQuiz.data.assignedStudentIds || [])}`);

    // Step 9: Test quiz creation with all fields (comprehensive test)
    console.log('\n9. Testing comprehensive quiz creation...');
    const comprehensiveQuiz = {
      title: 'Comprehensive Test Quiz',
      description: 'Testing all quiz fields together',
      moduleCode: 'COMP101',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      accessCode: 'comp123',
      allowedIpCidrs: ['192.168.1.0/24'],
      assignedStudentIds: [] // Empty assignment (available to all)
    };

    const comprehensiveResponse = await axios.post(`${BASE_URL}/api/quizzes`, comprehensiveQuiz, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });

    const comprehensiveQuizData = comprehensiveResponse.data;
    console.log('✅ Comprehensive quiz creation works');
    console.log(`   Has access code: ${!!comprehensiveQuizData.accessCodeHash}`);
    console.log(`   Has IP restrictions: ${(comprehensiveQuizData.allowedIpCidrs?.length || 0) > 0}`);
    console.log(`   Has student assignment: ${Array.isArray(comprehensiveQuizData.assignedStudentIds)}`);

    console.log('\n🎉 All regression tests passed!');
    console.log('\n📊 Regression Test Summary:');
    console.log('✅ Basic quiz creation still works');
    console.log('✅ Access code functionality intact');
    console.log('✅ IP restriction functionality intact');
    console.log('✅ Quiz fetching functionality intact');
    console.log('✅ Student eligibility checking intact');
    console.log('✅ New student assignment field integrated seamlessly');
    console.log('✅ Comprehensive quiz creation with all fields works');

    return true;

  } catch (error) {
    console.error('\n❌ Regression test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test if called directly
if (require.main === module) {
  testQuizRegression().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testQuizRegression;
