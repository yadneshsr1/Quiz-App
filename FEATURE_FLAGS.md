# Feature Flags Documentation

## Overview

This document describes the feature flag system implemented in the Quiz Application. Feature flags allow for safe, controlled deployment of new features and easy rollback if issues arise.

## Current Feature Flags

### SHOW_STUDENT_PHOTO

**Description**: Enables student photo display in the quiz-taking interface

**Default Value**: `false`

**Environment Variables**:
- Backend: `SHOW_STUDENT_PHOTO`
- Frontend: `REACT_APP_SHOW_STUDENT_PHOTO`

**Valid Values**: `true` or `false`

**Affected Components**:
- Backend: `/api/auth/me/photo`, `/api/auth/students/:id/photo`
- Frontend: `StudentHeader`, `QuizTaking`

**Features**:
- Student photo display in quiz header
- Academic access to student photos
- Secure photo URL validation
- HTTP caching for performance
- Fallback to initials avatar

## Configuration

### Development Environment

```bash
# Backend (server directory)
export SHOW_STUDENT_PHOTO=true

# Frontend (client directory)
export REACT_APP_SHOW_STUDENT_PHOTO=true
```

### Production Environment

```bash
# Backend
SHOW_STUDENT_PHOTO=true

# Frontend (set before build)
REACT_APP_SHOW_STUDENT_PHOTO=true npm run build
```

### Environment Files

**Backend (.env)**
```env
SHOW_STUDENT_PHOTO=true
```

**Frontend (.env)**
```env
REACT_APP_SHOW_STUDENT_PHOTO=true
```

## API Endpoints

### Feature Flag Status

**GET** `/api/auth/feature-flags`

**Authentication**: Required (Academic role only)

**Response**:
```json
{
  "activeFlags": {
    "SHOW_STUDENT_PHOTO": true
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "timestamp": "2025-09-01T13:50:00.000Z"
}
```

## Implementation Details

### Backend

Feature flags are managed through the centralized configuration in `server/config/featureFlags.js`:

```javascript
const { getFeatureFlag } = require('../config/featureFlags');
const SHOW_STUDENT_PHOTO = getFeatureFlag('SHOW_STUDENT_PHOTO');
```

### Frontend

Feature flags are managed through the centralized configuration in `client/src/config/featureFlags.js`:

```javascript
import { isFeatureEnabled } from '../config/featureFlags';
const SHOW_STUDENT_PHOTO = isFeatureEnabled('SHOW_STUDENT_PHOTO');
```

## Adding New Feature Flags

### 1. Backend Configuration

Add to `server/config/featureFlags.js`:

```javascript
NEW_FEATURE: {
  name: 'NEW_FEATURE',
  description: 'Description of the new feature',
  defaultValue: false,
  environment: {
    backend: 'NEW_FEATURE',
    frontend: 'REACT_APP_NEW_FEATURE'
  },
  endpoints: [
    '/api/new/endpoint'
  ],
  components: [
    'NewComponent'
  ]
}
```

### 2. Frontend Configuration

Add to `client/src/config/featureFlags.js`:

```javascript
NEW_FEATURE: {
  name: 'NEW_FEATURE',
  description: 'Description of the new feature',
  defaultValue: false,
  environment: 'REACT_APP_NEW_FEATURE',
  components: [
    'NewComponent'
  ]
}
```

### 3. Usage

```javascript
// Backend
const NEW_FEATURE = getFeatureFlag('NEW_FEATURE');

// Frontend
const NEW_FEATURE = isFeatureEnabled('NEW_FEATURE');
```

## Testing Feature Flags

### Manual Testing

1. Set environment variables
2. Restart server/client
3. Verify feature behavior
4. Test with flag disabled

### Automated Testing

Use the provided test scripts:

```bash
# Test feature flag behavior
node test-feature-flag.js

# Test complete system
node test-complete-caching.js
```

## Best Practices

1. **Always use centralized configuration** - Don't hardcode feature flag checks
2. **Provide meaningful defaults** - Features should work with default values
3. **Document thoroughly** - Update this document when adding new flags
4. **Test both states** - Verify behavior with flag enabled and disabled
5. **Monitor performance** - Ensure flags don't impact application performance
6. **Plan for removal** - Feature flags should be temporary, plan for cleanup

## Troubleshooting

### Common Issues

1. **Feature not appearing**: Check environment variables are set correctly
2. **Build issues**: Ensure frontend environment variables are set before build
3. **Permission errors**: Verify user has appropriate role for feature flag endpoints

### Debug Commands

```bash
# Check backend feature flags
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/auth/feature-flags

# Check environment variables
echo $SHOW_STUDENT_PHOTO
echo $REACT_APP_SHOW_STUDENT_PHOTO
```

## Security Considerations

- Feature flag status endpoint requires academic role
- Environment variables should be properly secured
- Feature flags should not expose sensitive information
- Validate all feature flag values

## Future Enhancements

- Database-stored feature flags for runtime changes
- A/B testing integration
- Feature flag analytics
- Admin interface for flag management
