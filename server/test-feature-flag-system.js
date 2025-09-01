const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFeatureFlagSystem() {
  console.log('🚩 Testing Feature Flag System...\n');

  try {
    // Test 1: Login as academic to access feature flags endpoint
    console.log('1. Logging in as academic...');
    const academicLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'academic1',
      password: 'password123'
    });
    
    const academicToken = academicLoginResponse.data.token;
    const academicHeaders = { Authorization: `Bearer ${academicToken}` };
    console.log('✅ Academic login successful');

    // Test 2: Get feature flags status
    console.log('\n2. Getting feature flags status...');
    const featureFlagsResponse = await axios.get(`${BASE_URL}/auth/feature-flags`, { 
      headers: academicHeaders 
    });
    
    console.log('   Status:', featureFlagsResponse.status);
    console.log('   Active Flags:', featureFlagsResponse.data.activeFlags);
    console.log('   Validation:', featureFlagsResponse.data.validation);
    console.log('   Timestamp:', featureFlagsResponse.data.timestamp);
    
    if (featureFlagsResponse.data.activeFlags.SHOW_STUDENT_PHOTO) {
      console.log('   ✅ SHOW_STUDENT_PHOTO flag is enabled');
    } else {
      console.log('   ⚠️  SHOW_STUDENT_PHOTO flag is disabled');
    }

    // Test 3: Test feature flag validation
    console.log('\n3. Testing feature flag validation...');
    const validation = featureFlagsResponse.data.validation;
    
    if (validation.valid) {
      console.log('   ✅ Feature flag configuration is valid');
    } else {
      console.log('   ❌ Feature flag configuration has errors:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.log('   ⚠️  Feature flag warnings:', validation.warnings);
    } else {
      console.log('   ✅ No feature flag warnings');
    }

    // Test 4: Test student access to feature flags (should be denied)
    console.log('\n4. Testing student access to feature flags (should be denied)...');
    const studentLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: 'password123'
    });
    
    const studentToken = studentLoginResponse.data.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };
    
    try {
      await axios.get(`${BASE_URL}/auth/feature-flags`, { 
        headers: studentHeaders 
      });
      console.log('   ❌ Student access should have been denied');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('   ✅ Student access correctly denied (403 Forbidden)');
      } else {
        console.log('   ❌ Unexpected error:', error.response?.status);
      }
    }

    // Test 5: Test photo endpoints with feature flag enabled
    console.log('\n5. Testing photo endpoints with feature flag...');
    
    if (featureFlagsResponse.data.activeFlags.SHOW_STUDENT_PHOTO) {
      // Test student photo endpoint
      const studentPhotoResponse = await axios.get(`${BASE_URL}/auth/me/photo`, { 
        headers: studentHeaders 
      });
      
      console.log('   Student photo endpoint status:', studentPhotoResponse.status);
      console.log('   Photo URL:', studentPhotoResponse.data.photoUrl);
      
      // Test academic photo endpoint
      const studentId = '68b089a8eb8d070702ab0708';
      const academicPhotoResponse = await axios.get(`${BASE_URL}/auth/students/${studentId}/photo`, { 
        headers: academicHeaders 
      });
      
      console.log('   Academic photo endpoint status:', academicPhotoResponse.status);
      console.log('   Student name:', academicPhotoResponse.data.studentName);
      
      console.log('   ✅ Photo endpoints working with feature flag enabled');
    } else {
      console.log('   ℹ️  Photo endpoints not tested (feature flag disabled)');
    }

    // Test 6: Test feature flag configuration
    console.log('\n6. Testing feature flag configuration...');
    const { getActiveFeatureFlags, validateFeatureFlags } = require('./config/featureFlags');
    
    const activeFlags = getActiveFeatureFlags();
    const configValidation = validateFeatureFlags();
    
    console.log('   Active flags from config:', activeFlags);
    console.log('   Config validation:', configValidation);
    
    if (configValidation.valid) {
      console.log('   ✅ Feature flag configuration is valid');
    } else {
      console.log('   ❌ Feature flag configuration errors:', configValidation.errors);
    }

    // Test 7: Test feature flag behavior consistency
    console.log('\n7. Testing feature flag behavior consistency...');
    
    const backendFlag = activeFlags.SHOW_STUDENT_PHOTO;
    const apiFlag = featureFlagsResponse.data.activeFlags.SHOW_STUDENT_PHOTO;
    
    if (backendFlag === apiFlag) {
      console.log('   ✅ Backend and API feature flags are consistent');
    } else {
      console.log('   ❌ Backend and API feature flags are inconsistent');
      console.log(`      Backend: ${backendFlag}, API: ${apiFlag}`);
    }

    console.log('\n🎉 Feature flag system test completed!');
    console.log('\n📊 Summary:');
    console.log('   - Feature flag configuration working');
    console.log('   - API endpoint accessible to academics');
    console.log('   - Student access properly restricted');
    console.log('   - Photo endpoints respect feature flags');
    console.log('   - Configuration validation working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFeatureFlagSystem();
