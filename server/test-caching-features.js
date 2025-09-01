const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCachingFeatures() {
  console.log('💾 Testing Caching Features...\n');

  try {
    // Test 1: Login as student
    console.log('1. Logging in as student...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Student login successful');

    // Test 2: First request to photo endpoint
    console.log('\n2. Making first request to photo endpoint...');
    const firstResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { headers });
    
    console.log(`   Status: ${firstResponse.status}`);
    console.log(`   Photo URL: ${firstResponse.data.photoUrl}`);
    
    // Check cache headers
    const cacheControl = firstResponse.headers['cache-control'];
    const etag = firstResponse.headers['etag'];
    const lastModified = firstResponse.headers['last-modified'];
    
    console.log(`   Cache-Control: ${cacheControl}`);
    console.log(`   ETag: ${etag}`);
    console.log(`   Last-Modified: ${lastModified}`);
    
    if (cacheControl && etag) {
      console.log('   ✅ Cache headers present');
    } else {
      console.log('   ❌ Cache headers missing');
    }

    // Test 3: Second request with If-None-Match header
    console.log('\n3. Making second request with If-None-Match header...');
    const secondHeaders = { 
      ...headers, 
      'If-None-Match': etag 
    };
    
    const secondResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { 
      headers: secondHeaders,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept 200-399
      }
    });
    
    console.log(`   Status: ${secondResponse.status}`);
    
    if (secondResponse.status === 304) {
      console.log('   ✅ 304 Not Modified response (caching working)');
    } else if (secondResponse.status === 200) {
      console.log('   ℹ️  200 OK response (cache miss or no caching)');
    } else {
      console.log(`   ❌ Unexpected status: ${secondResponse.status}`);
    }

    // Test 4: Test academic photo endpoint caching
    console.log('\n4. Testing academic photo endpoint caching...');
    
    // Login as academic
    const academicLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });
    
    const academicToken = academicLoginResponse.data.token;
    const academicHeaders = { Authorization: `Bearer ${academicToken}` };
    console.log('   ✅ Academic login successful');
    
    // Get student ID first
    const studentResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { headers });
    const studentId = '68b089a8eb8d070702ab0708'; // Use known student ID
    
    const academicPhotoResponse = await axios.get(`${BASE_URL}/auth/students/${studentId}/photo`, { 
      headers: academicHeaders 
    });
    
    console.log(`   Status: ${academicPhotoResponse.status}`);
    console.log(`   Student: ${academicPhotoResponse.data.studentName}`);
    console.log(`   Reg No: ${academicPhotoResponse.data.regNo}`);
    
    const academicCacheControl = academicPhotoResponse.headers['cache-control'];
    const academicETag = academicPhotoResponse.headers['etag'];
    
    console.log(`   Cache-Control: ${academicCacheControl}`);
    console.log(`   ETag: ${academicETag}`);
    
    if (academicCacheControl && academicETag) {
      console.log('   ✅ Academic photo endpoint cache headers present');
    } else {
      console.log('   ❌ Academic photo endpoint cache headers missing');
    }

    // Test 5: Test cache performance
    console.log('\n5. Testing cache performance...');
    const startTime = Date.now();
    
    // Make multiple requests to test caching
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(axios.get(`${BASE_URL}/auth/me/photo`, { headers }));
    }
    
    await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`   Total time for 3 requests: ${totalTime}ms`);
    console.log(`   Average time per request: ${(totalTime / 3).toFixed(2)}ms`);

    console.log('\n🎉 Caching features test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCachingFeatures();
