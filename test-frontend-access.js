// This simulates what the frontend does
console.log('🧪 Testing Frontend Access to Backend...\n');

// Test 1: Check if we can reach the server
async function testServerAccess() {
  try {
    console.log('🌐 Testing server access...');
    const response = await fetch('http://localhost:5000/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is accessible:', data.message);
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot reach server:', error.message);
    return false;
  }
}

// Test 2: Test quiz fetch (like frontend does)
async function testQuizFetch() {
  try {
    console.log('\n📚 Testing quiz fetch...');
    const quizId = '6896c710bc1932238cdae28e'; // Use a real quiz ID
    
    const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
    
    if (response.ok) {
      const quiz = await response.json();
      console.log('✅ Quiz fetched successfully:');
      console.log(`   Title: ${quiz.title}`);
      console.log(`   Questions: ${quiz.questions?.length || 0}`);
      console.log(`   Question IDs: ${quiz.questions?.map(q => q._id).join(', ')}`);
      return quiz;
    } else {
      console.log('❌ Quiz fetch failed:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.log('❌ Quiz fetch error:', error.message);
    return null;
  }
}

// Test 3: Test quiz submission (like frontend does)
async function testQuizSubmission(quizId, questionId) {
  try {
    console.log('\n📊 Testing quiz submission...');
    
    const answers = {};
    answers[questionId] = 1; // Correct answer
    
    const submissionData = {
      quizId: quizId,
      answers: answers,
      timeSpent: 120
    };
    
    console.log('Submitting data:', submissionData);
    
    const response = await fetch('http://localhost:5000/api/results/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Quiz submission successful:');
      console.log(`   Score: ${result.result.score}%`);
      console.log(`   Correct: ${result.result.correctAnswers}/${result.result.totalQuestions}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Quiz submission failed:', response.status, response.statusText);
      console.log('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Quiz submission error:', error.message);
    return false;
  }
}

// Run all tests
async function runFrontendTests() {
  console.log('🚀 Running Frontend Access Tests...\n');
  
  // Test 1: Server access
  const serverOk = await testServerAccess();
  if (!serverOk) {
    console.log('\n❌ Cannot proceed - server not accessible');
    return;
  }
  
  // Test 2: Quiz fetch
  const quiz = await testQuizFetch();
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    console.log('\n❌ Cannot proceed - no quiz with questions found');
    return;
  }
  
  // Test 3: Quiz submission
  const submissionOk = await testQuizSubmission(quiz._id, quiz.questions[0]._id);
  
  console.log('\n📊 Frontend Access Results:');
  console.log('Server Access:', serverOk ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Fetch:', quiz ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Submission:', submissionOk ? '✅ PASS' : '❌ FAIL');
  
  if (serverOk && quiz && submissionOk) {
    console.log('\n🎉 Frontend can access backend successfully!');
    console.log('\n💡 If you\'re still having issues:');
    console.log('1. Make sure you\'re using a real quiz ID in the URL');
    console.log('2. Check browser console for JavaScript errors');
    console.log('3. Verify you\'re logged in as a student');
    console.log('4. Try refreshing the page');
  } else {
    console.log('\n⚠️  Frontend access has issues. Check the error details above.');
  }
}

// Run the tests
runFrontendTests(); 