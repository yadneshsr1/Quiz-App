const http = require('http');

console.log('🔍 Checking server status...\n');

// Check backend server (port 5000)
const checkBackend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/quizzes', (res) => {
      console.log('✅ Backend server is running on port 5000');
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Backend server is not running on port 5000');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('❌ Backend server timeout on port 5000');
      resolve(false);
    });
  });
};

// Check frontend server (port 3000)
const checkFrontend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Frontend server is running on port 3000');
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Frontend server is not running on port 3000');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('❌ Frontend server timeout on port 3000');
      resolve(false);
    });
  });
};

async function checkStatus() {
  const backendRunning = await checkBackend();
  const frontendRunning = await checkFrontend();
  
  console.log('\n📋 Summary:');
  if (backendRunning && frontendRunning) {
    console.log('🎉 Both servers are running!');
    console.log('🌐 Open your browser to: http://localhost:3000');
    console.log('🔑 Login credentials:');
    console.log('   - Academic: username: academic1, password: password123');
    console.log('   - Student: username: student1, password: password123');
  } else {
    console.log('⚠️  Some servers are not running');
    console.log('💡 Make sure to start both servers:');
    console.log('   Terminal 1: cd server && npm run dev');
    console.log('   Terminal 2: cd client && npm start');
  }
}

checkStatus(); 