const fs = require('fs');
const path = require('path');

function testDocumentationSystem() {
  console.log('📚 Testing Documentation System...\n');

  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    issues: []
  };

  // Test 1: Check if all documentation files exist
  console.log('1. Checking documentation file existence...');
  
  const requiredDocs = [
    'README.md',
    'STUDENT_PHOTO_FEATURE.md',
    'FEATURE_FLAGS.md',
    'API.md',
    'PR_STUDENT_PHOTO_FEATURE.md'
  ];

  requiredDocs.forEach(doc => {
    testResults.total++;
    if (fs.existsSync(doc)) {
      console.log(`   ✅ ${doc} exists`);
      testResults.passed++;
    } else {
      console.log(`   ❌ ${doc} missing`);
      testResults.failed++;
      testResults.issues.push(`Missing documentation file: ${doc}`);
    }
  });

  // Test 2: Check documentation content quality
  console.log('\n2. Checking documentation content quality...');
  
  const docsToCheck = [
    { file: 'README.md', minSize: 5000 },
    { file: 'STUDENT_PHOTO_FEATURE.md', minSize: 8000 },
    { file: 'FEATURE_FLAGS.md', minSize: 3000 },
    { file: 'API.md', minSize: 6000 },
    { file: 'PR_STUDENT_PHOTO_FEATURE.md', minSize: 4000 }
  ];

  docsToCheck.forEach(({ file, minSize }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const size = content.length;
      
      if (size >= minSize) {
        console.log(`   ✅ ${file} has sufficient content (${size} chars)`);
        testResults.passed++;
      } else {
        console.log(`   ⚠️  ${file} content may be insufficient (${size} chars, expected ${minSize}+)`);
        testResults.failed++;
        testResults.issues.push(`Insufficient content in ${file}: ${size} chars (expected ${minSize}+)`);
      }
    }
  });

  // Test 3: Check for key documentation sections
  console.log('\n3. Checking for key documentation sections...');
  
  const keySections = [
    { file: 'README.md', sections: ['Features', 'Installation', 'Configuration', 'Testing'] },
    { file: 'STUDENT_PHOTO_FEATURE.md', sections: ['Overview', 'Architecture', 'Security', 'Performance'] },
    { file: 'FEATURE_FLAGS.md', sections: ['Configuration', 'API Endpoints', 'Best Practices'] },
    { file: 'API.md', sections: ['Authentication', 'Endpoints', 'Error Codes', 'Caching'] }
  ];

  keySections.forEach(({ file, sections }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const missingSections = sections.filter(section => 
        !content.includes(`## ${section}`) && !content.includes(`### ${section}`)
      );
      
      if (missingSections.length === 0) {
        console.log(`   ✅ ${file} contains all key sections`);
        testResults.passed++;
      } else {
        console.log(`   ❌ ${file} missing sections: ${missingSections.join(', ')}`);
        testResults.failed++;
        testResults.issues.push(`Missing sections in ${file}: ${missingSections.join(', ')}`);
      }
    }
  });

  // Test 4: Check for code examples
  console.log('\n4. Checking for code examples...');
  
  const filesWithCodeExamples = [
    'STUDENT_PHOTO_FEATURE.md',
    'FEATURE_FLAGS.md',
    'API.md'
  ];

  filesWithCodeExamples.forEach(file => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasCodeBlocks = content.includes('```javascript') || content.includes('```bash') || content.includes('```json');
      
      if (hasCodeBlocks) {
        console.log(`   ✅ ${file} contains code examples`);
        testResults.passed++;
      } else {
        console.log(`   ❌ ${file} missing code examples`);
        testResults.failed++;
        testResults.issues.push(`Missing code examples in ${file}`);
      }
    }
  });

  // Test 5: Check for security documentation
  console.log('\n5. Checking for security documentation...');
  
  const securityDocs = [
    { file: 'STUDENT_PHOTO_FEATURE.md', keywords: ['OWASP', 'CSP', 'XSS', 'validation'] },
    { file: 'API.md', keywords: ['Authentication', 'Authorization', 'Security Headers'] }
  ];

  securityDocs.forEach(({ file, keywords }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const foundKeywords = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length >= keywords.length * 0.7) {
        console.log(`   ✅ ${file} contains security documentation`);
        testResults.passed++;
      } else {
        console.log(`   ⚠️  ${file} may have insufficient security documentation`);
        testResults.failed++;
        testResults.issues.push(`Insufficient security documentation in ${file}`);
      }
    }
  });

  // Test 6: Check for testing documentation
  console.log('\n6. Checking for testing documentation...');
  
  const testingDocs = [
    { file: 'STUDENT_PHOTO_FEATURE.md', keywords: ['test', 'testing', 'validation'] },
    { file: 'API.md', keywords: ['test', 'curl', 'example'] }
  ];

  testingDocs.forEach(({ file, keywords }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const foundKeywords = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length >= keywords.length * 0.6) {
        console.log(`   ✅ ${file} contains testing documentation`);
        testResults.passed++;
      } else {
        console.log(`   ⚠️  ${file} may have insufficient testing documentation`);
        testResults.failed++;
        testResults.issues.push(`Insufficient testing documentation in ${file}`);
      }
    }
  });

  // Test 7: Check for deployment documentation
  console.log('\n7. Checking for deployment documentation...');
  
  const deploymentDocs = [
    { file: 'README.md', keywords: ['deployment', 'production', 'environment'] },
    { file: 'STUDENT_PHOTO_FEATURE.md', keywords: ['deployment', 'environment', 'build'] }
  ];

  deploymentDocs.forEach(({ file, keywords }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const foundKeywords = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length >= keywords.length * 0.6) {
        console.log(`   ✅ ${file} contains deployment documentation`);
        testResults.passed++;
      } else {
        console.log(`   ⚠️  ${file} may have insufficient deployment documentation`);
        testResults.failed++;
        testResults.issues.push(`Insufficient deployment documentation in ${file}`);
      }
    }
  });

  // Test 8: Check for troubleshooting documentation
  console.log('\n8. Checking for troubleshooting documentation...');
  
  const troubleshootingDocs = [
    { file: 'STUDENT_PHOTO_FEATURE.md', keywords: ['troubleshooting', 'debug', 'issue'] },
    { file: 'README.md', keywords: ['troubleshooting', 'debug', 'issue'] }
  ];

  troubleshootingDocs.forEach(({ file, keywords }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const foundKeywords = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length >= keywords.length * 0.5) {
        console.log(`   ✅ ${file} contains troubleshooting documentation`);
        testResults.passed++;
      } else {
        console.log(`   ⚠️  ${file} may have insufficient troubleshooting documentation`);
        testResults.failed++;
        testResults.issues.push(`Insufficient troubleshooting documentation in ${file}`);
      }
    }
  });

  // Test 9: Check documentation consistency
  console.log('\n9. Checking documentation consistency...');
  
  const consistencyChecks = [
    { file: 'README.md', shouldReference: ['STUDENT_PHOTO_FEATURE.md', 'FEATURE_FLAGS.md', 'API.md'] },
    { file: 'STUDENT_PHOTO_FEATURE.md', shouldReference: ['FEATURE_FLAGS.md', 'API.md'] }
  ];

  consistencyChecks.forEach(({ file, shouldReference }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const foundReferences = shouldReference.filter(ref => 
        content.includes(ref)
      );
      
      if (foundReferences.length >= shouldReference.length * 0.7) {
        console.log(`   ✅ ${file} has consistent cross-references`);
        testResults.passed++;
      } else {
        console.log(`   ⚠️  ${file} may have inconsistent cross-references`);
        testResults.failed++;
        testResults.issues.push(`Inconsistent cross-references in ${file}`);
      }
    }
  });

  // Test 10: Check for accessibility documentation
  console.log('\n10. Checking for accessibility documentation...');
  
  const accessibilityDocs = [
    { file: 'STUDENT_PHOTO_FEATURE.md', keywords: ['accessibility', 'WCAG', 'alt text', 'screen reader'] },
    { file: 'README.md', keywords: ['accessibility', 'WCAG'] }
  ];

  accessibilityDocs.forEach(({ file, keywords }) => {
    testResults.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const foundKeywords = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length >= keywords.length * 0.6) {
        console.log(`   ✅ ${file} contains accessibility documentation`);
        testResults.passed++;
      } else {
        console.log(`   ⚠️  ${file} may have insufficient accessibility documentation`);
        testResults.failed++;
        testResults.issues.push(`Insufficient accessibility documentation in ${file}`);
      }
    }
  });

  // Summary
  console.log('\n📊 Documentation System Test Summary:');
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    testResults.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }

  if (testResults.passed === testResults.total) {
    console.log('\n🎉 All documentation tests passed!');
    console.log('   - All required files exist');
    console.log('   - Content quality is sufficient');
    console.log('   - Key sections are present');
    console.log('   - Code examples included');
    console.log('   - Security documented');
    console.log('   - Testing procedures documented');
    console.log('   - Deployment guides included');
    console.log('   - Troubleshooting covered');
    console.log('   - Cross-references consistent');
    console.log('   - Accessibility documented');
  } else {
    console.log('\n❌ Some documentation issues found. Please review and update.');
  }

  return testResults.passed === testResults.total;
}

// Run the test
if (require.main === module) {
  testDocumentationSystem();
}

module.exports = { testDocumentationSystem };
