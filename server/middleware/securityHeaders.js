/**
 * Security headers middleware
 * Adds security headers including CSP for photo feature
 */
function securityHeaders(req, res, next) {
  // Content Security Policy - allow images from trusted sources
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React development
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow Material-UI styles
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: http: blob:", // Allow images from any HTTPS/HTTP source
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Security headers
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

module.exports = securityHeaders;
