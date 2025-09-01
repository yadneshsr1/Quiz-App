const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Generate self-signed certificate if not exists
const certDir = path.join(__dirname, 'ssl');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('🔐 Generating SSL certificate for HTTPS redirect...');
  const { execSync } = require('child_process');
  try {
    execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
    console.log('✅ SSL certificate generated');
  } catch (error) {
    console.error('❌ Failed to generate SSL certificate:', error.message);
    process.exit(1);
  }
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const PORT = process.env.PORT || 5000;
const HTTPS_PORT = PORT + 1;

// Create HTTPS server that redirects to HTTP
const httpsServer = https.createServer(httpsOptions, (req, res) => {
  const httpUrl = `http://${req.headers.host.replace(`:${HTTPS_PORT}`, `:${PORT}`)}${req.url}`;
  
  console.log(`🔄 Redirecting HTTPS request to HTTP: ${httpUrl}`);
  
  res.writeHead(301, {
    'Location': httpUrl,
    'Content-Type': 'text/html'
  });
  
  res.end(`
    <html>
      <head><title>Redirecting...</title></head>
      <body>
        <h1>Redirecting to HTTP</h1>
        <p>If you are not redirected automatically, <a href="${httpUrl}">click here</a>.</p>
        <script>window.location.href = "${httpUrl}";</script>
      </body>
    </html>
  `);
});

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`🔄 HTTPS redirect server running on port ${HTTPS_PORT}`);
  console.log(`   Redirects HTTPS requests to HTTP on port ${PORT}`);
  console.log(`   Access via: https://your-ip:${HTTPS_PORT}`);
  console.log(`   Will redirect to: http://your-ip:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down HTTPS redirect server...');
  httpsServer.close(() => {
    console.log('HTTPS redirect server closed');
    process.exit(0);
  });
});
