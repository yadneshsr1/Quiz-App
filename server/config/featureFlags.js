/**
 * Feature Flags Configuration
 * Centralized management of feature flags for the quiz application
 */

const featureFlags = {
  // Student Photo Feature
  SHOW_STUDENT_PHOTO: {
    name: 'SHOW_STUDENT_PHOTO',
    description: 'Enables student photo display in quiz-taking interface',
    defaultValue: false,
    environment: {
      backend: 'SHOW_STUDENT_PHOTO',
      frontend: 'REACT_APP_SHOW_STUDENT_PHOTO'
    },
    endpoints: [
      '/api/auth/me/photo',
      '/api/auth/students/:id/photo'
    ],
    components: [
      'StudentHeader',
      'QuizTaking'
    ]
  },

  // Future feature flags can be added here
  // EXAMPLE_FEATURE: {
  //   name: 'EXAMPLE_FEATURE',
  //   description: 'Description of the feature',
  //   defaultValue: false,
  //   environment: {
  //     backend: 'EXAMPLE_FEATURE',
  //     frontend: 'REACT_APP_EXAMPLE_FEATURE'
  //   }
  // }
};

/**
 * Get feature flag value
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} - Feature flag value
 */
function getFeatureFlag(flagName) {
  const flag = featureFlags[flagName];
  if (!flag) {
    console.warn(`Feature flag '${flagName}' not found`);
    return false;
  }

  const envVar = flag.environment.backend;
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
function getActiveFeatureFlags() {
  const active = {};
  Object.keys(featureFlags).forEach(flagName => {
    active[flagName] = getFeatureFlag(flagName);
  });
  return active;
}

/**
 * Validate feature flag configuration
 * @returns {Object} - Validation result
 */
function validateFeatureFlags() {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };

  Object.keys(featureFlags).forEach(flagName => {
    const flag = featureFlags[flagName];
    
    // Check required properties
    if (!flag.name || !flag.description || !flag.environment) {
      validation.valid = false;
      validation.errors.push(`Feature flag '${flagName}' missing required properties`);
    }
    
    // Check environment variables
    const backendEnv = process.env[flag.environment.backend];
    if (backendEnv && !['true', 'false'].includes(backendEnv)) {
      validation.warnings.push(`Feature flag '${flagName}' has invalid value: ${backendEnv}`);
    }
  });

  return validation;
}

module.exports = {
  featureFlags,
  getFeatureFlag,
  getActiveFeatureFlags,
  validateFeatureFlags
};
