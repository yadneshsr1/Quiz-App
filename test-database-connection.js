const mongoose = require('mongoose');

console.log('🔍 Testing Database Connection and Result Model...\n');

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/quiz-app');
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Test Result model
async function testResultModel() {
  try {
    console.log('\n📝 Testing Result Model...');
    
    // Import the Result model
    const Result = require('./server/models/Result');
    
    // Create a test result
    const testResult = new Result({
      quizId: new mongoose.Types.ObjectId('6896c710bc1932238cdae28e'),
      studentId: new mongoose.Types.ObjectId('000000000000000000000001'),
      answers: new Map([
        ['6896c710bc1932238cdae290', 1]
      ]),
      score: 100,
      correctAnswers: 1,
      totalQuestions: 1,
      timeSpent: 120
    });
    
    console.log('✅ Result model created successfully');
    console.log('Test result:', {
      quizId: testResult.quizId,
      studentId: testResult.studentId,
      score: testResult.score,
      answers: Object.fromEntries(testResult.answers)
    });
    
    return true;
  } catch (error) {
    console.log('❌ Result model test failed:', error.message);
    return false;
  }
}

// Test saving to database
async function testSaveToDatabase() {
  try {
    console.log('\n💾 Testing Save to Database...');
    
    const Result = require('./server/models/Result');
    
    // Create a test result
    const testResult = new Result({
      quizId: new mongoose.Types.ObjectId('6896c710bc1932238cdae28e'),
      studentId: new mongoose.Types.ObjectId('000000000000000000000001'),
      answers: new Map([
        ['6896c710bc1932238cdae290', 1]
      ]),
      score: 100,
      correctAnswers: 1,
      totalQuestions: 1,
      timeSpent: 120
    });
    
    // Save to database
    const savedResult = await testResult.save();
    console.log('✅ Result saved to database successfully');
    console.log('Saved result ID:', savedResult._id);
    
    // Try to find the result
    const foundResult = await Result.findById(savedResult._id);
    if (foundResult) {
      console.log('✅ Result found in database');
      console.log('Found result:', {
        id: foundResult._id,
        quizId: foundResult.quizId,
        studentId: foundResult.studentId,
        score: foundResult.score
      });
    } else {
      console.log('❌ Result not found in database');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Save to database failed:', error.message);
    return false;
  }
}

// Test querying results
async function testQueryResults() {
  try {
    console.log('\n🔍 Testing Query Results...');
    
    const Result = require('./server/models/Result');
    
    // Query results for a specific quiz
    const results = await Result.find({ 
      quizId: new mongoose.Types.ObjectId('6896c710bc1932238cdae28e') 
    });
    
    console.log(`✅ Found ${results.length} results for quiz`);
    
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. Student: ${result.studentId}, Score: ${result.score}%`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Query results failed:', error.message);
    return false;
  }
}

async function runDatabaseTests() {
  console.log('🚀 Starting Database Tests...\n');
  
  // Test 1: Database connection
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - database connection failed');
    return;
  }
  
  // Test 2: Result model
  const modelOk = await testResultModel();
  
  // Test 3: Save to database
  const saveOk = await testSaveToDatabase();
  
  // Test 4: Query results
  const queryOk = await testQueryResults();
  
  console.log('\n📊 Database Test Results:');
  console.log('Database Connection:', connectionOk ? '✅ PASS' : '❌ FAIL');
  console.log('Result Model:', modelOk ? '✅ PASS' : '❌ FAIL');
  console.log('Save to Database:', saveOk ? '✅ PASS' : '❌ FAIL');
  console.log('Query Results:', queryOk ? '✅ PASS' : '❌ FAIL');
  
  if (connectionOk && modelOk && saveOk && queryOk) {
    console.log('\n🎉 Database is working perfectly!');
  } else {
    console.log('\n⚠️  Some database tests failed. Check the logs above for details.');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
}

runDatabaseTests(); 