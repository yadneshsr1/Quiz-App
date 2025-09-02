const http = require('http');

console.log('🔍 Testing login page accessibility...\n');

const testLoginPage = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/login', (res) => {
      console.log(`✅ Login page is accessible (Status: ${res.statusCode})`);
      if (res.statusCode === 200) {
        console.log('🎉 Login page is working correctly!');
        console.log('🌐 Open your browser to: http://localhost:3000');
      }
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Login page is not accessible');
      console.log('💡 Make sure the React app is running: cd client && npm start');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Login page timeout');
      resolve(false);
    });
  });
};

testLoginPage(); 