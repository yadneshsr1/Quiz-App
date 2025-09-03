/**
 * Test the availability endpoint
 */

const https = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGIwODlhOGViOGQwNzA3MDJhYjA3MDgiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc1Njg3NTAyMSwiZXhwIjoxNzU2OTYxNDIxfQ.IYv4vGzK7zCqyFJbjHAUaQ4bTjmP94Gcc2Tz7SH0Zmw";
const studentId = "68b089a8eb8d070702ab0708";

const options = {
  hostname: 'localhost',
  port: 5000,
  path: `/api/debug/availability?studentId=${studentId}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('🔍 Availability Analysis for Alice Johnson:');
      console.log(`📊 Total quizzes: ${result.summary.total}`);
      console.log(`✅ Available: ${result.summary.available}`);
      console.log(`❌ Unavailable: ${result.summary.unavailable}`);
      
      console.log('\n📝 Available Quizzes:');
      result.quizzes.filter(q => q.isAvailable).forEach((quiz, index) => {
        console.log(`${index + 1}. ${quiz.title} (${quiz.quizId})`);
      });

      console.log('\n🚫 Recently Submitted Quizzes (should NOT be available):');
      result.quizzes
        .filter(q => !q.isAvailable && q.reasons.submissionOk.hasSubmission)
        .slice(0, 5) // Show last 5
        .forEach((quiz, index) => {
          console.log(`${index + 1}. ${quiz.title} (${quiz.quizId})`);
          if (quiz.reasons.submissionOk.submissionDetails) {
            const sub = quiz.reasons.submissionOk.submissionDetails;
            console.log(`   Submitted: ${new Date(sub.submittedAt).toLocaleString()}, Score: ${sub.score}%`);
          }
        });

    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.end();
