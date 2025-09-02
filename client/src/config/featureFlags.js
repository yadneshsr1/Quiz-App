/**
 * Frontend Feature Flags Configuration
 * Centralized management of feature flags for the React application
 */

const featureFlags = {
  // Student Photo Feature
  SHOW_STUDENT_PHOTO: {
    name: 'SHOW_STUDENT_PHOTO',
    description: 'Enables student photo display in quiz-taking interface',
    defaultValue: false,
    environment: 'REACT_APP_SHOW_STUDENT_PHOTO',
    components: [
      'StudentHeader',
      'QuizTaking'
    ]
  }
};

/**
 * Get feature flag value
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} - Feature flag value
 */
export function getFeatureFlag(flagName) {
  const flag = featureFlags[flagName];
  if (!flag) {
    console.warn(`Feature flag '${flagName}' not found`);
    return false;
  }

  const envVar = flag.environment;
  const value = process.env[envVar];
  
  if (value === undefined) {
    return flag.defaultValue;
  }
  
  return value === 'true';
}

/**
 * Get all active feature flags
 * @returns {Object} - Object with feature flag names and their values
 */
export function getActiveFeatureFlags() {
  const active = {};
  Object.keys(featureFlags).forEach(flagName => {
    active[flagName] = getFeatureFlag(flagName);
  });
  return active;
}

/**
 * Check if a feature is enabled
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} - Whether the feature is enabled
 */
export function isFeatureEnabled(flagName) {
  return getFeatureFlag(flagName);
}

/**
 * Get feature flag information
 * @param {string} flagName - Name of the feature flag
 * @returns {Object|null} - Feature flag information or null if not found
 */
export function getFeatureFlagInfo(flagName) {
  return featureFlags[flagName] || null;
}

export default featureFlags;
