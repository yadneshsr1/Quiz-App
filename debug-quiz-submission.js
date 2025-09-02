console.log('🔍 Debugging Quiz Submission Issues...\n');

// Step 1: Check what quiz IDs are available
async function checkAvailableQuizzes() {
  try {
    console.log('📋 Checking available quizzes...');
    const response = await fetch('http://localhost:5000/api/quizzes');
    const quizzes = await response.json();
    
    console.log(`Found ${quizzes.length} quizzes:`);
    quizzes.forEach((quiz, index) => {
      console.log(`  ${index + 1}. ID: ${quiz._id}, Title: ${quiz.title}, Questions: ${quiz.questions?.length || 0}`);
    });
    
    return quizzes;
  } catch (error) {
    console.log('❌ Error fetching quizzes:', error.message);
    return [];
  }
}

// Step 2: Test a specific quiz fetch
async function testQuizFetch(quizId) {
  try {
    console.log(`\n🔍 Testing quiz fetch for ID: ${quizId}`);
    const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
    
    if (!response.ok) {
      console.log(`❌ Quiz fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const quiz = await response.json();
    console.log(`✅ Quiz fetched successfully:`);
    console.log(`   Title: ${quiz.title}`);
    console.log(`   Questions: ${quiz.questions?.length || 0}`);
    
    if (quiz.questions && quiz.questions.length > 0) {
      console.log(`   Question IDs: ${quiz.questions.map(q => q._id).join(', ')}`);
    }
    
    return quiz;
  } catch (error) {
    console.log(`❌ Error fetching quiz ${quizId}:`, error.message);
    return null;
  }
}

// Step 3: Test quiz submission
async function testQuizSubmission(quizId, questionId) {
  try {
    console.log(`\n📊 Testing quiz submission...`);
    
    const answers = {};
    answers[questionId] = 0; // Test with first answer
    
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Submission failed: ${response.status} ${response.statusText}`);
      console.log(`Error details: ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    console.log(`✅ Submission successful:`);
    console.log(`   Score: ${result.result.score}%`);
    console.log(`   Correct: ${result.result.correctAnswers}/${result.result.totalQuestions}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Error submitting quiz:`, error.message);
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 Starting quiz submission diagnostics...\n');
  
  // Step 1: Check available quizzes
  const quizzes = await checkAvailableQuizzes();
  
  if (quizzes.length === 0) {
    console.log('\n❌ No quizzes found. Please create a quiz first.');
    return;
  }
  
  // Step 2: Test with first quiz
  const firstQuiz = quizzes[0];
  const quiz = await testQuizFetch(firstQuiz._id);
  
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    console.log('\n❌ Quiz has no questions. Please add questions first.');
    return;
  }
  
  // Step 3: Test submission
  const submissionOk = await testQuizSubmission(quiz._id, quiz.questions[0]._id);
  
  console.log('\n📊 Diagnostic Results:');
  console.log('Available Quizzes:', quizzes.length > 0 ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Fetch:', quiz ? '✅ PASS' : '❌ FAIL');
  console.log('Quiz Submission:', submissionOk ? '✅ PASS' : '❌ FAIL');
  
  if (submissionOk) {
    console.log('\n🎉 Quiz submission is working correctly!');
    console.log('\n💡 If you\'re still having issues in the frontend:');
    console.log('1. Check browser console for errors');
    console.log('2. Verify the quiz ID in the URL matches a real quiz');
    console.log('3. Make sure you\'re logged in as a student');
    console.log('4. Check network tab for failed requests');
  } else {
    console.log('\n⚠️  Quiz submission has issues. Check the error details above.');
  }
}

// Run diagnostics
runDiagnostics(); 