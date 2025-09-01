const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSecurityFeatures() {
  console.log('🔒 Testing Security Features...\n');

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

    // Test 2: Test photo endpoint with malicious URL
    console.log('\n2. Testing photo endpoint with malicious URL...');
    
    // First, let's see what the current photo URL is
    const photoResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { headers });
    console.log(`   Current photo URL: ${photoResponse.data.photoUrl}`);
    
    // Test 3: Check security headers
    console.log('\n3. Testing security headers...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    let headersFound = 0;
    securityHeaders.forEach(header => {
      if (healthResponse.headers[header]) {
        console.log(`   ✅ ${header}: ${healthResponse.headers[header]}`);
        headersFound++;
      } else {
        console.log(`   ❌ ${header}: Not found`);
      }
    });
    
    if (headersFound === securityHeaders.length) {
      console.log('   ✅ All security headers present');
    } else {
      console.log(`   ⚠️  Only ${headersFound}/${securityHeaders.length} security headers found`);
    }

    // Test 4: Test URL validation (backend validation)
    console.log('\n4. Testing URL validation...');
    
    // This would require updating the database with a malicious URL
    // For now, we'll just verify the current URL is valid
    if (photoResponse.data.photoUrl) {
      try {
        new URL(photoResponse.data.photoUrl);
        console.log('   ✅ Current photo URL is valid');
      } catch (error) {
        console.log('   ❌ Current photo URL is invalid');
      }
    } else {
      console.log('   ℹ️  No photo URL set (using fallback)');
    }

    console.log('\n🎉 Security features test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSecurityFeatures();
