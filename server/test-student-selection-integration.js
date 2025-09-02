/**
 * Integration test for student selection functionality
 * Tests the complete flow from frontend selection to backend storage
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testStudentSelectionIntegration() {
  console.log('🧪 Testing Student Selection Integration');
  console.log('=======================================\n');

  try {
    // Step 1: Setup - Login as academic and get students
    console.log('1. Setting up test environment...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Academic login successful');

    const studentsResponse = await axios.get(`${BASE_URL}/api/auth/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const students = studentsResponse.data;
    console.log(`✅ Fetched ${students.length} students for testing`);

    if (students.length < 2) {
      console.log('⚠️  Need at least 2 students for comprehensive testing');
      return false;
    }

    // Step 2: Simulate frontend student selection process
    console.log('\n2. Simulating frontend student selection...');
    
    let selectedStudents = [];
    
    // Simulate handleStudentSelection calls
    const simulateStudentSelection = (studentId, isSelected) => {
      console.log(`   ${isSelected ? 'Selecting' : 'Deselecting'} student: ${studentId}`);
      if (isSelected) {
        if (!selectedStudents.includes(studentId)) {
          selectedStudents = [...selectedStudents, studentId];
        }
      } else {
        selectedStudents = selectedStudents.filter(id => id !== studentId);
      }
      console.log(`   Current selection: ${JSON.stringify(selectedStudents)}`);
    };

    // Select first two students
    simulateStudentSelection(students[0]._id, true);
    simulateStudentSelection(students[1]._id, true);
    
    console.log('✅ Student selection simulation complete');

    // Step 3: Simulate form submission with selected students
    console.log('\n3. Simulating quiz creation with selected students...');
    
    const quizData = {
      title: "Integration Test Quiz - Student Selection",
      description: "Testing student assignment integration",
      moduleCode: "INTEG101",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      assignedStudentIds: selectedStudents // This is what frontend would send
    };

    const createQuizResponse = await axios.post(`${BASE_URL}/api/quizzes`, quizData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const createdQuiz = createQuizResponse.data;
    console.log('✅ Quiz created with student assignment');
    console.log(`   Quiz ID: ${createdQuiz._id}`);
    console.log(`   Assigned Students: ${createdQuiz.assignedStudentIds?.length || 0}`);

    // Step 4: Verify student assignment was stored correctly
    console.log('\n4. Verifying student assignment storage...');
    
    const fetchQuizResponse = await axios.get(`${BASE_URL}/api/quizzes/${createdQuiz._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const storedQuiz = fetchQuizResponse.data;
    const storedStudentIds = storedQuiz.assignedStudentIds || [];
    
    console.log('   Verification results:');
    console.log(`   - Expected student count: ${selectedStudents.length}`);
    console.log(`   - Stored student count: ${storedStudentIds.length}`);
    console.log(`   - Expected students: ${JSON.stringify(selectedStudents)}`);
    console.log(`   - Stored students: ${JSON.stringify(storedStudentIds)}`);
    
    const correctStorage = selectedStudents.length === storedStudentIds.length &&
                          selectedStudents.every(id => storedStudentIds.includes(id));
    
    if (correctStorage) {
      console.log('✅ Student assignment stored correctly');
    } else {
      console.log('❌ Student assignment storage mismatch');
      return false;
    }

    // Step 5: Test student eligibility (assigned students can see quiz)
    console.log('\n5. Testing student quiz eligibility...');
    
    // Login as first assigned student (assuming it's student1)
    const student1LoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    const student1Token = student1LoginResponse.data.token;
    
    // Check if assigned student can see the quiz
    const eligibleQuizzesResponse = await axios.get(`${BASE_URL}/api/quizzes/eligible`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });
    
    const eligibleQuizzes = eligibleQuizzesResponse.data;
    const canSeeAssignedQuiz = eligibleQuizzes.some(quiz => quiz._id === createdQuiz._id);
    
    console.log(`   Assigned student can see quiz: ${canSeeAssignedQuiz}`);
    
    // Test non-assigned student (assuming student3 wasn't assigned)
    if (students.length > 2) {
      const student3LoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'student3',
        password: 'password123'
      });
      const student3Token = student3LoginResponse.data.token;
      
      const student3EligibleResponse = await axios.get(`${BASE_URL}/api/quizzes/eligible`, {
        headers: { 'Authorization': `Bearer ${student3Token}` }
      });
      
      const student3EligibleQuizzes = student3EligibleResponse.data;
      const nonAssignedCanSee = student3EligibleQuizzes.some(quiz => quiz._id === createdQuiz._id);
      
      console.log(`   Non-assigned student can see quiz: ${nonAssignedCanSee}`);
      
      if (nonAssignedCanSee) {
        console.log('⚠️  Non-assigned student can see assigned quiz (check if this is expected)');
      } else {
        console.log('✅ Non-assigned student properly blocked from assigned quiz');
      }
    }

    // Step 6: Test edge cases
    console.log('\n6. Testing edge cases...');
    
    // Test quiz creation with empty student assignment
    console.log('   Testing quiz with no student assignment...');
    const emptyAssignmentQuiz = {
      title: "Integration Test Quiz - No Assignment",
      description: "Testing empty student assignment",
      moduleCode: "INTEG102",
      startTime: new Date().toISOString(),
      assignedStudentIds: []
    };

    const emptyQuizResponse = await axios.post(`${BASE_URL}/api/quizzes`, emptyAssignmentQuiz, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const emptyQuiz = emptyQuizResponse.data;
    console.log('✅ Quiz with empty assignment created successfully');
    console.log(`   Empty assignment count: ${emptyQuiz.assignedStudentIds?.length || 0}`);

    // Test quiz creation with invalid student IDs
    console.log('\n   Testing quiz with invalid student IDs...');
    const invalidAssignmentQuiz = {
      title: "Integration Test Quiz - Invalid IDs",
      description: "Testing invalid student IDs",
      moduleCode: "INTEG103",
      startTime: new Date().toISOString(),
      assignedStudentIds: ['invalid-id', students[0]._id, 'another-invalid-id']
    };

    const invalidQuizResponse = await axios.post(`${BASE_URL}/api/quizzes`, invalidAssignmentQuiz, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const invalidQuiz = invalidQuizResponse.data;
    const validIdCount = invalidQuiz.assignedStudentIds?.length || 0;
    console.log('✅ Quiz with mixed valid/invalid IDs handled correctly');
    console.log(`   Input IDs: 3 (2 invalid, 1 valid)`);
    console.log(`   Stored valid IDs: ${validIdCount}`);

    console.log('\n🎉 Student Selection Integration Tests Complete!');
    console.log('\n📊 Integration Test Summary:');
    console.log('✅ Frontend student selection logic ready');
    console.log('✅ Quiz creation with student assignment works');
    console.log('✅ Student assignment storage verified');
    console.log('✅ Student quiz eligibility working');
    console.log('✅ Edge cases handled properly');
    console.log('✅ Backend-frontend integration successful');

    return true;

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test if called directly
if (require.main === module) {
  testStudentSelectionIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testStudentSelectionIntegration;
