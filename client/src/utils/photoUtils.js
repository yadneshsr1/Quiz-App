/**
 * Frontend photo utilities with security considerations
 */

/**
 * Generates initials from a name for fallback avatar
 * @param {string} name - The full name
 * @returns {string} - Initials (e.g., "JD" for "John Doe")
 */
export function generateInitials(name) {
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

/**
 * Validates photo URL on frontend (basic validation)
 * @param {string} photoUrl - The photo URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export function isValidPhotoUrl(photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return false;
  }

  try {
    const url = new URL(photoUrl);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Safely handles image loading errors
 * @param {Event} event - The error event
 * @param {Function} setImageLoadFailed - Function to set image load failed state
 */
export function handleImageError(event, setImageLoadFailed) {
  console.warn('Image failed to load:', event.target.src);
  setImageLoadFailed(true);
  
  // Hide the failed image
  if (event.target) {
    event.target.style.display = 'none';
  }
}
