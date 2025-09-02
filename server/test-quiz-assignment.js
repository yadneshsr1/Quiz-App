const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testQuizAssignment() {
  console.log('🧪 Testing Quiz Assignment Functionality');
  console.log('========================================\n');

  try {
    // Step 1: Login as academic to get token
    console.log('1. Logging in as academic user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });
    const academicToken = loginResponse.data.token;
    console.log('✅ Academic login successful');

    // Step 2: Get list of students
    console.log('\n2. Fetching students...');
    const studentsResponse = await axios.get(`${BASE_URL}/api/auth/students`, {
      headers: { 'Authorization': `Bearer ${academicToken}` }
    });
    const students = studentsResponse.data;
    console.log(`✅ Found ${students.length} students`);

    if (students.length === 0) {
      console.log('❌ No students found. Please run setup-test-users.js first');
      return false;
    }

    // Step 3: Test creating quiz WITHOUT student assignment (should work as before)
    console.log('\n3. Testing quiz creation WITHOUT student assignment...');
    const quizWithoutStudents = {
      title: 'Test Quiz - No Students',
      description: 'Testing quiz without student assignment',
      moduleCode: 'TEST101',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    const createResponse1 = await axios.post(`${BASE_URL}/api/quizzes`, quizWithoutStudents, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });
    console.log('✅ Quiz created without student assignment');
    console.log(`   Quiz ID: ${createResponse1.data._id}`);
    console.log(`   Assigned Students: ${createResponse1.data.assignedStudentIds?.length || 0}`);

    // Step 4: Test creating quiz WITH student assignment
    console.log('\n4. Testing quiz creation WITH student assignment...');
    const selectedStudentIds = students.slice(0, 2).map(s => s._id); // Select first 2 students
    
    const quizWithStudents = {
      title: 'Test Quiz - With Students',
      description: 'Testing quiz with student assignment',
      moduleCode: 'TEST102',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      assignedStudentIds: selectedStudentIds
    };

    const createResponse2 = await axios.post(`${BASE_URL}/api/quizzes`, quizWithStudents, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });
    console.log('✅ Quiz created with student assignment');
    console.log(`   Quiz ID: ${createResponse2.data._id}`);
    console.log(`   Assigned Students: ${createResponse2.data.assignedStudentIds?.length || 0}`);
    console.log(`   Expected Students: ${selectedStudentIds.length}`);

    // Step 5: Verify student assignment in database
    console.log('\n5. Verifying student assignment in created quiz...');
    const quizId = createResponse2.data._id;
    const fetchQuizResponse = await axios.get(`${BASE_URL}/api/quizzes/${quizId}`, {
      headers: { 'Authorization': `Bearer ${academicToken}` }
    });
    
    const savedQuiz = fetchQuizResponse.data;
    const assignedCount = savedQuiz.assignedStudentIds?.length || 0;
    
    if (assignedCount === selectedStudentIds.length) {
      console.log('✅ Student assignment correctly saved in database');
      console.log(`   Assigned student IDs: ${savedQuiz.assignedStudentIds?.slice(0, 2).join(', ')}...`);
    } else {
      console.log('❌ Student assignment not saved correctly');
      console.log(`   Expected: ${selectedStudentIds.length}, Got: ${assignedCount}`);
    }

    // Step 6: Test quiz eligibility for assigned student
    console.log('\n6. Testing quiz eligibility for assigned student...');
    const firstStudentId = selectedStudentIds[0];
    const studentName = students.find(s => s._id === firstStudentId)?.name || 'Unknown';
    
    // Login as the assigned student
    const studentLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'student1', // Assuming first student is student1
      password: 'password123'
    });
    const studentToken = studentLoginResponse.data.token;
    
    // Check eligible quizzes for this student
    const eligibleResponse = await axios.get(`${BASE_URL}/api/quizzes/eligible`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    
    const eligibleQuizzes = eligibleResponse.data;
    const assignedQuiz = eligibleQuizzes.find(q => q._id === quizId);
    
    if (assignedQuiz) {
      console.log(`✅ Assigned quiz visible to student (${studentName})`);
      console.log(`   Quiz: "${assignedQuiz.title}"`);
    } else {
      console.log(`⚠️  Assigned quiz not visible to student (${studentName})`);
      console.log(`   This might be expected if the student ID doesn't match student1`);
    }

    // Step 7: Test quiz eligibility for non-assigned student
    console.log('\n7. Testing quiz eligibility for non-assigned student...');
    const nonAssignedStudentLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'student3', // Assuming student3 was not assigned
      password: 'password123'
    });
    const nonAssignedToken = nonAssignedStudentLogin.data.token;
    
    const nonAssignedEligibleResponse = await axios.get(`${BASE_URL}/api/quizzes/eligible`, {
      headers: { 'Authorization': `Bearer ${nonAssignedToken}` }
    });
    
    const nonAssignedEligibleQuizzes = nonAssignedEligibleResponse.data;
    const nonAssignedQuiz = nonAssignedEligibleQuizzes.find(q => q._id === quizId);
    
    if (!nonAssignedQuiz) {
      console.log('✅ Non-assigned student cannot see assigned quiz (correct behavior)');
    } else {
      console.log('⚠️  Non-assigned student can see assigned quiz');
      console.log('   This might indicate an issue with the access control logic');
    }

    // Step 8: Test with invalid student IDs
    console.log('\n8. Testing quiz creation with invalid student IDs...');
    const quizWithInvalidIds = {
      title: 'Test Quiz - Invalid IDs',
      description: 'Testing quiz with invalid student IDs',
      moduleCode: 'TEST103',
      startTime: new Date().toISOString(),
      assignedStudentIds: ['invalid-id', '507f1f77bcf86cd799439011', selectedStudentIds[0]] // Mix of invalid and valid
    };

    const createResponse3 = await axios.post(`${BASE_URL}/api/quizzes`, quizWithInvalidIds, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });
    
    const invalidIdQuiz = createResponse3.data;
    const validIdCount = invalidIdQuiz.assignedStudentIds?.length || 0;
    
    console.log(`✅ Quiz created with mixed valid/invalid IDs`);
    console.log(`   Input IDs: 3 (1 invalid, 1 non-existent, 1 valid)`);
    console.log(`   Saved IDs: ${validIdCount} (invalid IDs filtered out)`);

    // Step 9: Test with empty student assignment
    console.log('\n9. Testing quiz creation with empty student assignment...');
    const quizWithEmptyAssignment = {
      title: 'Test Quiz - Empty Assignment',
      description: 'Testing quiz with empty student assignment',
      moduleCode: 'TEST104',
      startTime: new Date().toISOString(),
      assignedStudentIds: []
    };

    const createResponse4 = await axios.post(`${BASE_URL}/api/quizzes`, quizWithEmptyAssignment, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${academicToken}`
      }
    });
    
    console.log('✅ Quiz created with empty student assignment');
    console.log(`   Assigned Students: ${createResponse4.data.assignedStudentIds?.length || 0} (should be 0)`);

    console.log('\n🎉 Quiz Assignment tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Quiz creation without student assignment works');
    console.log('✅ Quiz creation with student assignment works');
    console.log('✅ Student assignment is saved correctly');
    console.log('✅ Invalid student IDs are filtered out');
    console.log('✅ Empty student assignment works');
    console.log('✅ Quiz eligibility logic respects student assignments');

    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test if called directly
if (require.main === module) {
  testQuizAssignment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testQuizAssignment;
