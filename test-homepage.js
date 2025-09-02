const http = require('http');

console.log('🔍 Testing homepage...\n');

const testHomepage = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log(`✅ Homepage is accessible (Status: ${res.statusCode})`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data.includes('Quiz App Login')) {
          console.log('🎉 Login page is being served correctly!');
        } else if (data.includes('React')) {
          console.log('📝 React app is running but might need to refresh');
        } else {
          console.log('❓ Unknown content being served');
        }
        console.log('🌐 Open your browser to: http://localhost:3000');
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Homepage is not accessible');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Homepage timeout');
      resolve(false);
    });
  });
};

testHomepage(); 