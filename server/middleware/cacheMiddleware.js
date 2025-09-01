/**
 * Cache middleware for conditional requests
 * Handles ETag validation and 304 Not Modified responses
 */

function cacheMiddleware(req, res, next) {
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to add ETag handling
  res.send = function(data) {
    // Check if client sent If-None-Match header
    const ifNoneMatch = req.get('If-None-Match');
    const etag = res.get('ETag');
    
    if (ifNoneMatch && etag && ifNoneMatch === etag) {
      // Resource hasn't changed, send 304 Not Modified
      res.status(304).end();
      return;
    }
    
    // Call original send method
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Generate ETag for photo data
 * @param {string} userId - User ID
 * @param {string} photoUrl - Photo URL
 * @returns {string} - ETag value
 */
function generatePhotoETag(userId, photoUrl) {
  const hash = require('crypto').createHash('md5')
    .update(`${userId}-${photoUrl || 'no-photo'}`)
    .digest('hex');
  return `"photo-${hash}"`;
}

/**
 * Set appropriate cache headers for photo responses
 * @param {Object} res - Express response object
 * @param {string} userId - User ID
 * @param {string} photoUrl - Photo URL
 * @param {number} maxAge - Cache duration in seconds (default: 300)
 */
function setPhotoCacheHeaders(res, userId, photoUrl, maxAge = 300) {
  const etag = generatePhotoETag(userId, photoUrl);
  
  res.set('Cache-Control', `public, max-age=${maxAge}`);
  res.set('ETag', etag);
  res.set('Last-Modified', new Date().toUTCString());
}

module.exports = {
  cacheMiddleware,
  generatePhotoETag,
  setPhotoCacheHeaders
};
