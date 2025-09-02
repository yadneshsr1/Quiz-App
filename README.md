# Quiz Application

A comprehensive quiz management system built with React, Node.js, and MongoDB. This application provides a robust platform for creating, managing, and taking quizzes with advanced features including student photo display, real-time analytics, and secure authentication.

## Features

### Core Features
- **Quiz Management**: Create, edit, and manage quizzes with multiple question types
- **Student Portal**: Take quizzes with real-time progress tracking
- **Academic Dashboard**: Comprehensive analytics and quiz management
- **Authentication**: Secure JWT-based authentication with role-based access
- **Real-time Analytics**: Live quiz performance tracking and insights

### Student Photo Feature ✨
- **Visual Verification**: Display student photos during quiz-taking
- **Academic Oversight**: Academics can view student photos for verification
- **Secure Implementation**: Comprehensive URL validation and sanitization
- **Performance Optimized**: HTTP caching and conditional requests
- **Accessibility Compliant**: WCAG 2.1 AA standards with proper alt text
- **Feature Flagged**: Safe deployment with easy rollback capability

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, Material-UI, React Router
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: MongoDB with Mongoose ODM
- **Security**: OWASP compliance, CSP headers, input validation
- **Performance**: HTTP caching, ETag validation, conditional requests

### Project Structure
```
quiz-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
└── docs/                # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yadneshsr1/Quiz-App.git
   cd quiz-app
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment variables
   cd server
   cp .env.example .env
   # Edit .env with your configuration

   # Frontend environment variables
   cd ../client
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend server
   cd server
   npm start

   # Start frontend development server
   cd ../client
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/quiz-app
JWT_SECRET=your-jwt-secret
SHOW_STUDENT_PHOTO=true
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SHOW_STUDENT_PHOTO=true
```

### Feature Flags

The application uses feature flags for safe deployment:

- `SHOW_STUDENT_PHOTO`: Enables student photo display feature
- See [Feature Flags Documentation](./FEATURE_FLAGS.md) for details

## 📚 Documentation

### Core Documentation
- [Student Photo Feature](./STUDENT_PHOTO_FEATURE.md) - Comprehensive guide to the photo feature
- [Feature Flags](./FEATURE_FLAGS.md) - Feature flag management system
- [API Documentation](./API.md) - Backend API reference
- [Security Guide](./SECURITY.md) - Security implementation details

### Development Guides
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute to the project
- [Testing Guide](./TESTING.md) - Testing strategies and procedures
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions

## Testing

### Automated Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Feature-specific tests
cd server
node test-feature-flag-system.js
node test-security-features.js
node test-caching-features.js
node test-complete-caching.js
```

### Manual Testing
- [Testing Checklist](./TESTING.md#manual-testing-checklist)
- [Feature Flag Testing](./FEATURE_FLAGS.md#testing-feature-flags)
- [Security Testing](./SECURITY.md#testing-security-features)

## 🔒 Security

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Academic and student role separation
- **Input Validation**: Comprehensive input sanitization
- **Content Security Policy**: XSS protection with CSP headers
- **HTTPS Enforcement**: Secure communication protocols
- **OWASP Compliance**: Follows OWASP Top 10 security guidelines

### Security Testing
```bash
# Test security features
cd server
node test-security-features.js

# Validate security headers
curl -I http://localhost:5000/api/auth/me
```

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- **Alt Text**: All images have descriptive alt text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Compatible with assistive technology
- **Color Contrast**: High contrast ratios for readability
- **Focus Indicators**: Clear focus states for navigation

## 📊 Performance

### Performance Features
- **HTTP Caching**: ETag-based caching with 304 responses
- **Conditional Requests**: Efficient cache validation
- **Image Optimization**: Lazy loading and fallback handling
- **Bundle Optimization**: Code splitting and tree shaking
- **Database Optimization**: Efficient queries and indexing

### Performance Monitoring
```bash
# Performance testing
cd server
node test-complete-caching.js

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/auth/me/photo
```

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export SHOW_STUDENT_PHOTO=true
   ```

2. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

3. **Deploy Backend**
   ```bash
   cd server
   npm start
   ```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## 🔄 Feature Flags

### Managing Feature Flags
```bash
# Check feature flag status
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/auth/feature-flags

# Enable/disable features
export SHOW_STUDENT_PHOTO=true  # Enable
export SHOW_STUDENT_PHOTO=false # Disable
```

### Rollback Procedure
1. Disable feature flag
2. Restart backend server
3. Rebuild frontend (if needed)
4. Verify functionality

## 🐛 Troubleshooting

### Common Issues

#### Student Photo Not Displaying
```bash
# Check feature flag
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/auth/feature-flags

# Check environment variables
echo $SHOW_STUDENT_PHOTO
echo $REACT_APP_SHOW_STUDENT_PHOTO
```

#### API Connection Issues
```bash
# Test API connectivity
curl http://localhost:5000/api/health

# Check server logs
tail -f server.log
```

#### Performance Issues
```bash
# Monitor response times
node test-complete-caching.js

# Check cache headers
curl -I http://localhost:5000/api/auth/me/photo
```

### Debug Commands
```bash
# Server logs
tail -f server.log | grep -i error

# Feature flag testing
node test-feature-flag-system.js

# Security validation
node test-security-features.js

# Performance testing
node test-complete-caching.js
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Update documentation
6. Submit a pull request

### Code Standards
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Follow security best practices
- Ensure accessibility compliance

## 📝 Changelog

### Version 2.0.0 (Current)
- ✨ Added Student Photo Feature
- 🔒 Enhanced security with CSP headers
- ⚡ Improved performance with HTTP caching
- ♿ Enhanced accessibility compliance
- 🚩 Implemented feature flag system
- 📚 Comprehensive documentation

### Version 1.0.0
- 🎯 Core quiz functionality
- 👥 User authentication and roles
- 📊 Analytics and reporting
- 🎨 Material-UI interface

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material-UI for the component library
- MongoDB for the database solution
- Express.js for the web framework
- React team for the frontend framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review troubleshooting guides
- Contact the development team

---

**Built with ❤️ for educational excellence**
