const url = require('url');

/**
 * Validates and sanitizes photo URLs
 * @param {string} photoUrl - The photo URL to validate
 * @returns {object} - { isValid: boolean, sanitizedUrl: string, error: string }
 */
function validatePhotoUrl(photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return { isValid: false, sanitizedUrl: null, error: 'Invalid photo URL format' };
  }

  // Trim whitespace
  const trimmedUrl = photoUrl.trim();
  
  if (trimmedUrl.length === 0) {
    return { isValid: false, sanitizedUrl: null, error: 'Photo URL cannot be empty' };
  }

  // Check URL length (prevent extremely long URLs)
  if (trimmedUrl.length > 2048) {
    return { isValid: false, sanitizedUrl: null, error: 'Photo URL too long' };
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { isValid: false, sanitizedUrl: null, error: 'Only HTTP and HTTPS protocols allowed' };
    }

    // Block potentially dangerous domains (basic list)
    const dangerousDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'file://',
      'data:',
      'javascript:',
      'vbscript:'
    ];

    const hostname = parsedUrl.hostname.toLowerCase();
    for (const dangerous of dangerousDomains) {
      if (hostname.includes(dangerous) || trimmedUrl.toLowerCase().startsWith(dangerous)) {
        return { isValid: false, sanitizedUrl: null, error: 'Potentially dangerous URL detected' };
      }
    }

    // Return sanitized URL
    return { 
      isValid: true, 
      sanitizedUrl: trimmedUrl, 
      error: null 
    };

  } catch (error) {
    return { isValid: false, sanitizedUrl: null, error: 'Invalid URL format' };
  }
}

/**
 * Generates initials from a name for fallback avatar
 * @param {string} name - The full name
 * @returns {string} - Initials (e.g., "JD" for "John Doe")
 */
function generateInitials(name) {
  if (!name || typeof name !== 'string') {
    return 'U';
  }

  const words = name.trim().split(/\s+/);
  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

module.exports = {
  validatePhotoUrl,
  generateInitials
};
