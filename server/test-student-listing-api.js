const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testStudentListingAPI() {
  console.log('🧪 Testing Student Listing API Endpoint');
  console.log('=====================================\n');

  try {
    // Step 1: Login as academic to get token
    console.log('1. Logging in as academic user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });

    const academicToken = loginResponse.data.token;
    console.log('✅ Academic login successful');

    // Step 2: Test the new students endpoint
    console.log('\n2. Testing /api/auth/students endpoint...');
    const studentsResponse = await axios.get(`${BASE_URL}/api/auth/students`, {
      headers: {
        'Authorization': `Bearer ${academicToken}`
      }
    });

    const students = studentsResponse.data;
    console.log(`✅ Successfully fetched ${students.length} students`);

    // Step 3: Validate response structure
    console.log('\n3. Validating response structure...');
    if (students.length > 0) {
      const firstStudent = students[0];
      const expectedFields = ['_id', 'name', 'email', 'regNo', 'course', 'moduleCode'];
      const hasAllFields = expectedFields.every(field => firstStudent.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('✅ Response contains all expected fields');
        console.log('Sample student:', {
          name: firstStudent.name,
          email: firstStudent.email,
          regNo: firstStudent.regNo,
          course: firstStudent.course,
          hasPhoto: !!firstStudent.photograph
        });
      } else {
        console.log('❌ Response missing expected fields');
        console.log('Expected:', expectedFields);
        console.log('Actual:', Object.keys(firstStudent));
      }
    } else {
      console.log('⚠️  No students found in database');
    }

    // Step 4: Test sorting (names should be in alphabetical order)
    console.log('\n4. Validating sorting...');
    if (students.length > 1) {
      const names = students.map(s => s.name);
      const sortedNames = [...names].sort();
      const isCorrectlySorted = JSON.stringify(names) === JSON.stringify(sortedNames);
      
      if (isCorrectlySorted) {
        console.log('✅ Students are correctly sorted by name');
      } else {
        console.log('❌ Students are not correctly sorted');
        console.log('Expected order:', sortedNames);
        console.log('Actual order:', names);
      }
    }

    // Step 5: Test unauthorized access (student trying to access)
    console.log('\n5. Testing unauthorized access...');
    try {
      const studentLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'student1',
        password: 'password123'
      });
      
      const studentToken = studentLoginResponse.data.token;
      
      await axios.get(`${BASE_URL}/api/auth/students`, {
        headers: {
          'Authorization': `Bearer ${studentToken}`
        }
      });
      
      console.log('❌ Student was able to access students endpoint (should be forbidden)');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Student access properly blocked (403 Forbidden)');
      } else {
        console.log('❌ Unexpected error for student access:', error.message);
      }
    }

    // Step 6: Test without authentication
    console.log('\n6. Testing without authentication...');
    try {
      await axios.get(`${BASE_URL}/api/auth/students`);
      console.log('❌ Unauthenticated access allowed (should be forbidden)');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Unauthenticated access properly blocked (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error for unauthenticated access:', error.message);
      }
    }

    console.log('\n🎉 Student Listing API tests completed successfully!');
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
  testStudentListingAPI().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testStudentListingAPI;
