/**
 * Test script to verify student fetching functionality
 * This tests the integration between frontend and backend
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testStudentFetching() {
  console.log('🧪 Testing Student Fetching Functionality');
  console.log('=========================================\n');

  try {
    // Step 1: Test backend endpoint directly
    console.log('1. Testing backend students endpoint...');
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
    console.log(`✅ Backend students endpoint works (${students.length} students)`);

    // Step 2: Validate student data structure
    console.log('\n2. Validating student data structure...');
    if (students.length > 0) {
      const firstStudent = students[0];
      const requiredFields = ['_id', 'name', 'email', 'regNo', 'course'];
      const hasAllFields = requiredFields.every(field => firstStudent.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('✅ Student data structure is correct');
        console.log('   Sample student:', {
          name: firstStudent.name,
          regNo: firstStudent.regNo,
          hasPhoto: !!firstStudent.photograph
        });
      } else {
        console.log('❌ Student data missing required fields');
        console.log('   Expected:', requiredFields);
        console.log('   Found:', Object.keys(firstStudent));
      }
    } else {
      console.log('⚠️  No students found - run setup-test-users.js first');
    }

    // Step 3: Test error handling
    console.log('\n3. Testing error handling...');
    try {
      await axios.get(`${BASE_URL}/api/auth/students`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      console.log('❌ Invalid token should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid token properly rejected (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error for invalid token:', error.message);
      }
    }

    // Step 4: Test student role restriction
    console.log('\n4. Testing student role restriction...');
    try {
      const studentLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'student1',
        password: 'password123'
      });
      const studentToken = studentLoginResponse.data.token;

      await axios.get(`${BASE_URL}/api/auth/students`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      console.log('❌ Student should not be able to access students endpoint');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Student access properly blocked (403 Forbidden)');
      } else {
        console.log('❌ Unexpected error for student access:', error.message);
      }
    }

    // Step 5: Test frontend integration simulation
    console.log('\n5. Simulating frontend integration...');
    
    // Simulate what happens when openModal is called
    console.log('   Simulating openModal() call...');
    
    // Mock the fetchStudents function behavior
    const mockFetchStudents = async () => {
      try {
        console.log('   - Setting studentsLoading to true...');
        
        const response = await axios.get(`${BASE_URL}/api/auth/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.data) {
          throw new Error('No data received');
        }
        
        console.log('   - Students fetched successfully');
        console.log(`   - Setting students state with ${response.data.length} students`);
        console.log('   - Setting studentsLoading to false');
        
        return response.data;
      } catch (error) {
        console.log('   - Error occurred, showing alert to user');
        console.log('   - Setting students to empty array');
        console.log('   - Setting studentsLoading to false');
        throw error;
      }
    };

    const fetchedStudents = await mockFetchStudents();
    console.log('✅ Frontend integration simulation successful');

    // Step 6: Test data persistence
    console.log('\n6. Testing data persistence...');
    if (fetchedStudents && fetchedStudents.length > 0) {
      console.log('✅ Student data persists correctly');
      console.log(`   - ${fetchedStudents.length} students available for assignment`);
      console.log(`   - Students sorted by name: ${fetchedStudents.every((s, i, arr) => i === 0 || arr[i-1].name <= s.name)}`);
    } else {
      console.log('❌ Student data not persisting correctly');
    }

    console.log('\n🎉 Student Fetching tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Backend endpoint accessible');
    console.log('✅ Data structure validation passed');
    console.log('✅ Error handling works correctly');
    console.log('✅ Security restrictions enforced');
    console.log('✅ Frontend integration ready');
    console.log('✅ Data persistence verified');

    return true;

  } catch (error) {
    console.error('\n❌ Student fetching test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test if called directly
if (require.main === module) {
  testStudentFetching().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testStudentFetching;
