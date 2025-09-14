/**
 * Comprehensive Security Features Tests
 * Tests authentication, authorization, input validation, and security headers
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models and routes
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const authRoutes = require('../routes/authRoutes');
const quizRoutes = require('../routes/quizRoutes');

let mongoServer;
let app;
let studentUser, academicUser;
let studentToken, academicToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/quizzes', quizRoutes);
  
  // Create test users
  studentUser = await User.create({
    username: 'securitystudent',
    password: 'password123',
    name: 'Security Test Student',
    email: 'security@student.com',
    role: 'student',
    regNo: 'SEC001'
  });
  
  academicUser = await User.create({
    username: 'securityacademic',
    password: 'password123',
    name: 'Security Test Academic',
    email: 'security@academic.com',
    role: 'academic',
    department: 'Computer Science'
  });
  
  // Get authentication tokens
  const studentLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'securitystudent', password: 'password123' });
  studentToken = studentLogin.body.token;
  
  const academicLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'securityacademic', password: 'password123' });
  academicToken = academicLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Security Features', () => {
  
  describe('JWT Token Security', () => {
    test('token contains correct user information', () => {
      const decoded = jwt.verify(studentToken, process.env.JWT_SECRET || 'dev-secret');
      expect(decoded.id).toBe(String(studentUser._id));
      expect(decoded.role).toBe('student');
      expect(decoded.exp).toBeDefined();
    });

    test('expired token is rejected', async () => {
      const expiredToken = jwt.sign(
        { id: studentUser._id, role: 'student' },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token.');
    });

    test('token with wrong secret is rejected', async () => {
      const wrongSecretToken = jwt.sign(
        { id: studentUser._id, role: 'student' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token.');
    });

    test('malformed token is rejected', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token.');
    });
  });

  describe('Role-Based Access Control', () => {
    let testQuiz;

    beforeEach(async () => {
      testQuiz = await Quiz.create({
        title: 'Security Test Quiz',
        description: 'Test quiz for security',
        moduleCode: 'SEC101',
        startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        endTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });
    });

    afterEach(async () => {
      await Quiz.deleteMany({});
    });

    test('student cannot access academic-only endpoints', async () => {
      const response = await request(app)
        .get('/api/quizzes/all') // Academic-only endpoint
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access denied');
    });

    test('academic can access academic-only endpoints', async () => {
      const response = await request(app)
        .get('/api/quizzes/all')
        .set('Authorization', `Bearer ${academicToken}`);

      expect(response.status).toBe(200);
    });

    test('student can only access assigned quizzes', async () => {
      // Create quiz not assigned to student
      const unassignedQuiz = await Quiz.create({
        title: 'Unassigned Quiz',
        moduleCode: 'UNASSIGNED',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [], // Not assigned to anyone
        createdBy: academicUser._id
      });

      const response = await request(app)
        .get(`/api/quizzes/${unassignedQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('SQL injection attempts are blocked', async () => {
      const maliciousInput = {
        username: "admin'; DROP TABLE users; --",
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousInput);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      
      // Verify users table still exists
      const userCount = await User.countDocuments();
      expect(userCount).toBeGreaterThan(0);
    });

    test('XSS attempts in registration are sanitized', async () => {
      const maliciousData = {
        username: 'xsstest',
        password: 'password123',
        name: '<script>alert("XSS")</script>',
        email: 'xss@test.com',
        role: 'student',
        regNo: 'XSS001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData);

      expect(response.status).toBe(201);
      expect(response.body.user.name).not.toContain('<script>');
    });

    test('oversized payloads are rejected', async () => {
      const oversizedData = {
        username: 'oversized',
        password: 'password123',
        name: 'A'.repeat(10000), // Very long name
        email: 'oversized@test.com',
        role: 'student',
        regNo: 'OVER001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(oversizedData);

      expect(response.status).toBe(400);
    });

    test('invalid email formats are rejected', async () => {
      const invalidEmailData = {
        username: 'invalidemail',
        password: 'password123',
        name: 'Invalid Email User',
        email: 'not-an-email',
        role: 'student',
        regNo: 'INV001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData);

      expect(response.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    test('security headers are present in responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('CORS headers are properly configured', async () => {
      const response = await request(app)
        .options('/api/auth/me')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Launch Ticket Security', () => {
    let testQuiz;

    beforeEach(async () => {
      testQuiz = await Quiz.create({
        title: 'Ticket Security Test Quiz',
        moduleCode: 'TICK101',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });
    });

    afterEach(async () => {
      await Quiz.deleteMany({});
    });

    test('launch ticket is required for quiz start', async () => {
      const response = await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`);
        // No launch ticket header

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Launch ticket required');
    });

    test('invalid launch ticket is rejected', async () => {
      const response = await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', 'invalid-ticket');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid launch ticket');
    });

    test('expired launch ticket is rejected', async () => {
      const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || "quiz-launch-secret-dev-only";
      const expiredTicket = jwt.sign({
        sub: String(studentUser._id),
        quizId: String(testQuiz._id),
        typ: "launch",
        jti: 'expired_ticket_jti',
        exp: Math.floor((Date.now() - 60 * 1000) / 1000) // Expired 1 minute ago
      }, QUIZ_TOKEN_SECRET);

      const response = await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', expiredTicket);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Launch ticket expired');
    });

    test('launch ticket for wrong quiz is rejected', async () => {
      // Create another quiz
      const otherQuiz = await Quiz.create({
        title: 'Other Quiz',
        moduleCode: 'OTHER101',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });

      // Get launch ticket for other quiz
      const launchResponse = await request(app)
        .post(`/api/quizzes/${otherQuiz._id}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      const launchTicket = launchResponse.body.ticket;

      // Try to use it for original quiz
      const startResponse = await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', launchTicket);

      expect(startResponse.status).toBe(403);
      expect(startResponse.body.error).toBe('Launch ticket mismatch');
    });

    test('launch ticket cannot be reused', async () => {
      // Get launch ticket
      const launchResponse = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      const launchTicket = launchResponse.body.ticket;

      // First use should succeed
      const firstStart = await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', launchTicket);

      expect(firstStart.status).toBe(200);

      // Second use should fail
      const secondStart = await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', launchTicket);

      expect(secondStart.status).toBe(403);
      expect(secondStart.body.error).toBe('Ticket already used');
    });
  });

  describe('IP-based Access Control', () => {
    let restrictedQuiz;

    beforeEach(async () => {
      restrictedQuiz = await Quiz.create({
        title: 'IP Restricted Quiz',
        moduleCode: 'IP101',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id,
        allowedIpCidrs: ['192.168.1.0/24'] // Restrict to local network
      });
    });

    afterEach(async () => {
      await Quiz.deleteMany({});
    });

    test('access from allowed IP range succeeds', async () => {
      // Mock request IP to be in allowed range
      const originalApp = app;
      app.use((req, res, next) => {
        req.ip = '192.168.1.100';
        next();
      });

      const response = await request(app)
        .post(`/api/quizzes/${restrictedQuiz._id}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(response.status).toBe(200);
      
      app = originalApp; // Restore original app
    });

    test('access from disallowed IP range fails', async () => {
      // Mock request IP to be outside allowed range
      app.use((req, res, next) => {
        req.ip = '10.0.0.1'; // Outside allowed range
        next();
      });

      const response = await request(app)
        .post(`/api/quizzes/${restrictedQuiz._id}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('IP address not allowed');
    });
  });

  describe('Rate Limiting and Abuse Prevention', () => {
    test('multiple rapid login attempts are limited', async () => {
      const loginData = {
        username: 'securitystudent',
        password: 'wrongpassword'
      };

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send(loginData)
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Exposure Prevention', () => {
    test('user passwords are never returned in responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.password).toBeUndefined();
      expect(response.body._id).toBeDefined();
      expect(response.body.username).toBeDefined();
    });

    test('sensitive quiz data is not exposed to unauthorized users', async () => {
      const quiz = await Quiz.create({
        title: 'Sensitive Quiz',
        moduleCode: 'SENS101',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [], // Public quiz
        createdBy: academicUser._id,
        accessCode: 'secret123'
      });

      const response = await request(app)
        .get('/api/quizzes/eligible')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      const returnedQuiz = response.body.find(q => q._id === String(quiz._id));
      expect(returnedQuiz.accessCode).toBeUndefined(); // Should not expose access code
    });
  });
});
