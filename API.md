# API Documentation

## Overview

The Quiz Application API provides a comprehensive set of endpoints for quiz management, user authentication, and student photo features. All endpoints follow RESTful conventions and use JWT authentication.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "student1",
  "password": "password123",
  "name": "Alice Johnson",
  "regNo": "2023001",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68b089a8eb8d070702ab0708",
      "username": "student1",
      "name": "Alice Johnson",
      "regNo": "2023001",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "student1",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68b089a8eb8d070702ab0708",
      "username": "student1",
      "name": "Alice Johnson",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /auth/me
Get current authenticated user information.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "68b089a8eb8d070702ab0708",
    "username": "student1",
    "name": "Alice Johnson",
    "regNo": "2023001",
    "role": "student",
    "photograph": "https://example.com/photo.jpg"
  }
}
```

### Student Photo Endpoints

#### GET /auth/me/photo
Get current user's photo URL (feature flagged).

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "photoUrl": "https://example.com/photo.jpg"
}
```

**Cache Headers:**
```http
Cache-Control: public, max-age=300
ETag: "photo-abc123def456"
Last-Modified: Mon, 01 Sep 2025 13:50:00 GMT
```

#### GET /auth/students/:id/photo
Get student photo by ID (academic role only).

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` (string, required): Student user ID

**Response:**
```json
{
  "photoUrl": "https://example.com/photo.jpg",
  "studentName": "Alice Johnson",
  "regNo": "2023001"
}
```

**Cache Headers:**
```http
Cache-Control: public, max-age=300
ETag: "photo-abc123def456"
Last-Modified: Mon, 01 Sep 2025 13:50:00 GMT
```

#### GET /auth/feature-flags
Get feature flag status (academic role only).

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
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

### Quiz Management

#### GET /quizzes
Get all quizzes available to the authenticated user.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "68b4ea003b9d4338f4d75c37",
      "title": "Test Quiz",
      "description": "A test quiz",
      "duration": 30,
      "totalQuestions": 10,
      "accessCode": "123456",
      "startDate": "2025-09-01T00:00:00.000Z",
      "endDate": "2025-09-30T23:59:59.000Z"
    }
  ]
}
```

#### GET /quizzes/:id
Get specific quiz details.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` (string, required): Quiz ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "68b4ea003b9d4338f4d75c37",
    "title": "Test Quiz",
    "description": "A test quiz",
    "duration": 30,
    "questions": [
      {
        "id": "68b4ea443b9d4338f4d75c67",
        "text": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": 1
      }
    ]
  }
}
```

#### POST /quizzes/:id/launch
Launch a quiz with access code verification.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` (string, required): Quiz ID

**Request Body:**
```json
{
  "accessCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quizId": "68b4ea003b9d4338f4d75c37",
    "startTime": "2025-09-01T13:50:00.000Z",
    "duration": 30
  }
}
```

#### POST /quizzes/:id/submit
Submit quiz answers.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` (string, required): Quiz ID

**Request Body:**
```json
{
  "answers": {
    "68b4ea443b9d4338f4d75c67": 1,
    "68b4ea443b9d4338f4d75c68": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "resultId": "68b4fa5ebd3eda7090e35af1"
  }
}
```

### Analytics (Academic Only)

#### GET /analytics/quiz/:id
Get quiz analytics and results.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` (string, required): Quiz ID

**Response:**
```json
{
  "success": true,
  "data": {
    "quizTitle": "Test Quiz",
    "totalSubmissions": 25,
    "averageScore": 75.5,
    "questionAnalytics": [
      {
        "questionId": "68b4ea443b9d4338f4d75c67",
        "correctCount": 20,
        "totalAnswered": 25,
        "correctPercentage": 80
      }
    ]
  }
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 304 | Not Modified (caching) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "User not authenticated",
  "status": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Academic role required.",
  "status": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Quiz not found",
  "status": 404
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid access code",
  "status": 400
}
```

## Caching

### Photo Endpoints
Photo endpoints support HTTP caching with ETags:

```http
# First request
GET /api/auth/me/photo
Authorization: Bearer <token>

# Response includes cache headers
Cache-Control: public, max-age=300
ETag: "photo-abc123def456"
Last-Modified: Mon, 01 Sep 2025 13:50:00 GMT

# Subsequent request with ETag
GET /api/auth/me/photo
Authorization: Bearer <token>
If-None-Match: "photo-abc123def456"

# Response if unchanged
HTTP/1.1 304 Not Modified
```

### Conditional Requests
Use conditional headers for efficient caching:

```http
# Check if resource has changed
If-None-Match: "photo-abc123def456"
If-Modified-Since: Mon, 01 Sep 2025 13:50:00 GMT
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Photo endpoints**: 60 requests per minute
- **Quiz endpoints**: 30 requests per minute
- **Analytics endpoints**: 10 requests per minute

## Security Headers

All responses include security headers:

```http
Content-Security-Policy: default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Testing

### Test Endpoints

Use the provided test scripts to validate API functionality:

```bash
# Test photo endpoints
node test-photo-endpoint.js

# Test academic photo endpoint
node test-academic-photo-endpoint.js

# Test feature flags
node test-feature-flag-system.js

# Test security features
node test-security-features.js

# Test caching
node test-caching-features.js

# Complete system test
node test-complete-caching.js
```

### Example cURL Commands

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}'

# Get user photo
curl -X GET http://localhost:5000/api/auth/me/photo \
  -H "Authorization: Bearer <token>"

# Get feature flags
curl -X GET http://localhost:5000/api/auth/feature-flags \
  -H "Authorization: Bearer <academic_token>"

# Test caching
curl -X GET http://localhost:5000/api/auth/me/photo \
  -H "Authorization: Bearer <token>" \
  -H "If-None-Match: \"photo-abc123def456\""
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get user photo
const getPhoto = async () => {
  try {
    const response = await api.get('/auth/me/photo');
    return response.data.photoUrl;
  } catch (error) {
    console.error('Error fetching photo:', error.response.data);
  }
};

// Get feature flags
const getFeatureFlags = async () => {
  try {
    const response = await api.get('/auth/feature-flags');
    return response.data.activeFlags;
  } catch (error) {
    console.error('Error fetching feature flags:', error.response.data);
  }
};
```

### Python

```python
import requests

class QuizAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def get_photo(self):
        response = requests.get(
            f'{self.base_url}/auth/me/photo',
            headers=self.headers
        )
        return response.json()['photoUrl']
    
    def get_feature_flags(self):
        response = requests.get(
            f'{self.base_url}/auth/feature-flags',
            headers=self.headers
        )
        return response.json()['activeFlags']
```

## Versioning

API versioning is handled through URL paths:

- Current version: `/api/` (v1)
- Future versions: `/api/v2/`

## Support

For API support and questions:

1. Check the error responses for specific issues
2. Review the test scripts for usage examples
3. Validate your JWT token and permissions
4. Check feature flag status for photo endpoints
5. Contact the development team for additional support

## Changelog

### Version 1.2.0 (Current)
- ✨ Added student photo endpoints
- 🔒 Enhanced security headers
- ⚡ Improved caching with ETags
- 🚩 Added feature flag endpoint
- 📚 Comprehensive API documentation

### Version 1.1.0
- 📊 Added analytics endpoints
- 🔐 Enhanced authentication
- 🎯 Improved quiz management

### Version 1.0.0
- 🎯 Core quiz functionality
- 👥 User authentication
- 📝 Basic CRUD operations
