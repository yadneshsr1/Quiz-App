const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.EXTERNAL_PORT || 5001;

// CORS configuration for external access
app.use(cors({
  origin: '*', // Allow all origins for external access
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'External access server is running',
    timestamp: new Date().toISOString(),
    server: 'External Access Server'
  });
});

// Proxy all requests to the main server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  logLevel: 'info',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying request: ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({
      error: 'Proxy error',
      message: 'Unable to connect to main server. Please ensure the main server is running on port 5000.',
      details: err.message
    });
  }
}));

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Get server IP for external access
const os = require('os');
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
  console.log('🌐 External Access Server Started');
  console.log('================================');
  console.log(`Server running on port ${PORT}`);
  console.log('Access URLs:');
  console.log(`  - Local: http://localhost:${PORT}`);
  console.log(`  - Network: http://${localIP}:${PORT}`);
  console.log(`  - External: http://143.167.178.160:${PORT}`);
  console.log('');
  console.log('📋 Instructions for client devices:');
  console.log(`  1. Open browser on client device`);
  console.log(`  2. Navigate to: http://143.167.178.160:${PORT}`);
  console.log(`  3. The application should load normally`);
  console.log('');
  console.log('⚠️  Note: This server proxies all requests to the main server on port 5000');
  console.log('   Make sure the main server is running before accessing this URL');
  console.log('================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down external access server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down external access server...');
  process.exit(0);
});
