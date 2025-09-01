const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating SSL Certificate for Development...\n');

const certDir = path.join(__dirname, 'ssl');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

// Create SSL directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log('✅ Created SSL directory');
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ SSL certificates already exist');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('\n📝 To use these certificates, add to your .env file:');
  console.log(`   SSL_KEY_PATH=${keyPath}`);
  console.log(`   SSL_CERT_PATH=${certPath}`);
  process.exit(0);
}

try {
  // Generate self-signed certificate
  const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;
  
  console.log('🔧 Generating certificate...');
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ SSL certificate generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  
  console.log('\n📝 Add these lines to your .env file:');
  console.log(`   SSL_KEY_PATH=${keyPath}`);
  console.log(`   SSL_CERT_PATH=${certPath}`);
  
  console.log('\n⚠️  Note: This is a self-signed certificate for development only.');
  console.log('   Browsers will show a security warning - you can proceed safely.');
  console.log('   For production, use a proper SSL certificate from a trusted CA.');
  
} catch (error) {
  console.error('❌ Error generating SSL certificate:', error.message);
  console.log('\n💡 Alternative: You can generate certificates manually using:');
  console.log('   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes');
  process.exit(1);
}
