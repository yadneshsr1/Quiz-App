/**
 * IP CIDR validation utility for quiz access control
 * Handles both IPv4 and IPv6 CIDR notation
 */

/**
 * Check if an IP address is within any of the allowed CIDR ranges
 * @param {string} ip - IP address to check (IPv4 or IPv6)
 * @param {string[]} cidrs - Array of CIDR ranges (e.g., ["192.168.1.0/24", "10.0.0.0/8"])
 * @returns {boolean} - True if IP is allowed, false otherwise
 */
function isIpAllowed(ip, cidrs) {
  // If no CIDRs specified, allow all IPs (backwards compatibility)
  if (!cidrs || !Array.isArray(cidrs) || cidrs.length === 0) {
    return true;
  }

  // Normalize IP address
  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) {
    console.warn(`[IPCHECK] Invalid IP address: ${ip}`);
    return false;
  }

  // Check if IP matches any of the allowed CIDRs
  for (const cidr of cidrs) {
    try {
      if (isIpInCidr(normalizedIp, cidr.trim())) {
        return true;
      }
    } catch (error) {
      console.warn(`[IPCHECK] Invalid CIDR format: ${cidr} - ${error.message}`);
      // Skip invalid CIDRs and continue checking others
      continue;
    }
  }

  return false;
}

/**
 * Normalize IP address for comparison
 * @param {string} ip - IP address string
 * @returns {string|null} - Normalized IP or null if invalid
 */
function normalizeIp(ip) {
  if (!ip) return null;
  
  // Handle IPv6 localhost
  if (ip === '::1' || ip === 'localhost') {
    return '127.0.0.1';
  }
  
  // Handle IPv4 localhost
  if (ip === '127.0.0.1') {
    return '127.0.0.1';
  }
  
  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    const isValid = parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
    return isValid ? ip : null;
  }
  
  // Basic IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(ip)) {
    return ip;
  }
  
  return null;
}

/**
 * Check if an IP is within a CIDR range
 * @param {string} ip - IP address
 * @param {string} cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns {boolean} - True if IP is in CIDR range
 */
function isIpInCidr(ip, cidr) {
  // Handle single IP addresses by automatically converting to /32 CIDR
  let normalizedCidr = cidr;
  if (!cidr.includes('/')) {
    // If it's just an IP address without prefix, treat it as /32 (single host)
    if (cidr.includes('.')) {
      normalizedCidr = `${cidr}/32`; // IPv4 single host
    } else if (cidr.includes(':')) {
      normalizedCidr = `${cidr}/128`; // IPv6 single host
    }
  }

  const [network, prefixLength] = normalizedCidr.split('/');
  if (!network || !prefixLength) {
    throw new Error(`Invalid CIDR format: ${cidr}`);
  }

  const prefix = parseInt(prefixLength, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 128) {
    throw new Error(`Invalid prefix length: ${prefixLength}`);
  }

  // Handle IPv4
  if (ip.includes('.')) {
    return isIpv4InCidr(ip, network, prefix);
  }
  
  // Handle IPv6
  if (ip.includes(':')) {
    return isIpv6InCidr(ip, network, prefix);
  }
  
  throw new Error(`Unsupported IP format: ${ip}`);
}

/**
 * Check if IPv4 address is within CIDR range
 * @param {string} ip - IPv4 address
 * @param {string} network - Network address
 * @param {number} prefix - Prefix length (0-32)
 * @returns {boolean} - True if IP is in network
 */
function isIpv4InCidr(ip, network, prefix) {
  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(network);
  
  // Handle special case: 0.0.0.0/0 allows all IPv4 addresses
  if (prefix === 0) {
    return true;
  }
  
  const mask = prefix === 32 ? 0xFFFFFFFF : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  
  return (ipNum & mask) === (networkNum & mask);
}

/**
 * Check if IPv6 address is within CIDR range
 * @param {string} ip - IPv6 address
 * @param {string} network - Network address
 * @param {number} prefix - Prefix length (0-128)
 * @returns {boolean} - True if IP is in network
 */
function isIpv6InCidr(ip, network, prefix) {
  // Simplified IPv6 check - for production, consider using a library like ip-cidr
  // This is a basic implementation that handles common cases
  
  // For now, just check exact match for IPv6 (most restrictive)
  // In production, you'd want to use a proper IPv6 CIDR library
  return ip === network;
}

/**
 * Convert IPv4 address to number for comparison
 * @param {string} ip - IPv4 address
 * @returns {number} - IP as 32-bit number
 */
function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Validate and normalize CIDR input
 * @param {string} cidr - CIDR string to validate
 * @returns {string|null} - Normalized CIDR or null if invalid
 */
function validateAndNormalizeCidr(cidr) {
  if (!cidr || typeof cidr !== 'string') return null;
  
  const trimmed = cidr.trim();
  if (!trimmed) return null;
  
  // If it's already a valid CIDR, return as is
  if (trimmed.includes('/')) {
    try {
      // Test if it's a valid CIDR by trying to parse it
      const [network, prefix] = trimmed.split('/');
      if (!network || !prefix) return null;
      
      const prefixNum = parseInt(prefix, 10);
      if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 128) return null;
      
      // Basic network validation
      if (network.includes('.')) {
        // IPv4
        if (prefixNum > 32) return null;
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipv4Regex.test(network)) return null;
      } else if (network.includes(':')) {
        // IPv6
        if (prefixNum > 128) return null;
        // Basic IPv6 validation (simplified)
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (!ipv6Regex.test(network)) return null;
      }
      
      return trimmed;
    } catch (error) {
      return null;
    }
  }
  
  // If it's a single IP address, convert to CIDR
  if (trimmed.includes('.')) {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(trimmed)) {
      return `${trimmed}/32`;
    }
  } else if (trimmed.includes(':')) {
    // IPv6
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(trimmed)) {
      return `${trimmed}/128`;
    }
  }
  
  return null;
}

module.exports = {
  isIpAllowed,
  normalizeIp,
  isIpInCidr,
  validateAndNormalizeCidr
};
