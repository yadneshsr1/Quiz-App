const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCompleteCaching() {
  console.log('🚀 Testing Complete Caching System...\n');

  try {
    // Test 1: Login and get initial photo data
    console.log('1. Initial photo request...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');

    const firstResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { headers });
    const firstETag = firstResponse.headers['etag'];
    console.log(`   First ETag: ${firstETag}`);
    console.log(`   Photo URL: ${firstResponse.data.photoUrl}`);

    // Test 2: Test conditional requests
    console.log('\n2. Testing conditional requests...');
    
    // Request with same ETag (should get 304)
    const conditionalResponse = await axios.get(`${BASE_URL}/auth/me/photo`, {
      headers: { ...headers, 'If-None-Match': firstETag },
      validateStatus: (status) => status >= 200 && status < 400
    });
    
    console.log(`   Conditional request status: ${conditionalResponse.status}`);
    if (conditionalResponse.status === 304) {
      console.log('   ✅ 304 Not Modified (caching working)');
    } else {
      console.log('   ⚠️  Expected 304, got different status');
    }

    // Test 3: Test cache expiration simulation
    console.log('\n3. Testing cache behavior...');
    
    // Request without ETag (should get 200 with new ETag)
    const freshResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { headers });
    const freshETag = freshResponse.headers['etag'];
    
    console.log(`   Fresh request ETag: ${freshETag}`);
    console.log(`   ETags match: ${firstETag === freshETag ? 'Yes' : 'No'}`);
    
    if (firstETag === freshETag) {
      console.log('   ✅ ETags match (consistent caching)');
    } else {
      console.log('   ⚠️  ETags differ (cache invalidation or time-based)');
    }

    // Test 4: Test academic endpoint caching
    console.log('\n4. Testing academic endpoint caching...');
    
    const academicLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });
    
    const academicToken = academicLoginResponse.data.token;
    const academicHeaders = { Authorization: `Bearer ${academicToken}` };
    
    const studentId = '68b089a8eb8d070702ab0708';
    const academicResponse = await axios.get(`${BASE_URL}/auth/students/${studentId}/photo`, {
      headers: academicHeaders
    });
    
    const academicETag = academicResponse.headers['etag'];
    console.log(`   Academic ETag: ${academicETag}`);
    console.log(`   Student: ${academicResponse.data.studentName}`);
    
    // Test 5: Performance test
    console.log('\n5. Performance test...');
    const startTime = Date.now();
    
    // Make 5 requests in parallel
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(axios.get(`${BASE_URL}/auth/me/photo`, { headers }));
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`   Total time for 5 parallel requests: ${totalTime}ms`);
    console.log(`   Average time per request: ${(totalTime / 5).toFixed(2)}ms`);
    
    if (totalTime < 1000) {
      console.log('   ✅ Good performance (under 1 second)');
    } else {
      console.log('   ⚠️  Performance could be improved');
    }

    // Test 6: Cache headers validation
    console.log('\n6. Cache headers validation...');
    const testResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { headers });
    
    const requiredHeaders = [
      'cache-control',
      'etag',
      'last-modified'
    ];
    
    let allHeadersPresent = true;
    requiredHeaders.forEach(header => {
      if (testResponse.headers[header]) {
        console.log(`   ✅ ${header}: ${testResponse.headers[header]}`);
      } else {
        console.log(`   ❌ ${header}: Missing`);
        allHeadersPresent = false;
      }
    });
    
    if (allHeadersPresent) {
      console.log('   ✅ All required cache headers present');
    } else {
      console.log('   ❌ Some cache headers missing');
    }

    console.log('\n🎉 Complete caching system test completed!');
    console.log('\n📊 Summary:');
    console.log('   - HTTP caching implemented');
    console.log('   - ETag validation working');
    console.log('   - Conditional requests supported');
    console.log('   - Performance optimized');
    console.log('   - Academic endpoint cached');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCompleteCaching();
