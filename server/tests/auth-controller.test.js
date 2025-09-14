/**
 * Authentication Controller Tests
 * Tests JWT authentication, role-based access, and security features
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models and routes
const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication Controller', () => {
  
  describe('User Registration', () => {
    test('creates new student user successfully', async () => {
      const userData = {
        username: 'teststudent',
        password: 'password123',
        name: 'Test Student',
        email: 'test@student.com',
        role: 'student',
        regNo: 'ST001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('teststudent');
      expect(response.body.user.role).toBe('student');
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    test('creates new academic user successfully', async () => {
      const userData = {
        username: 'testacademic',
        password: 'password123',
        name: 'Test Academic',
        email: 'test@academic.com',
        role: 'academic',
        department: 'Computer Science'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('academic');
      expect(response.body.user.department).toBe('Computer Science');
    });

    test('prevents duplicate username registration', async () => {
      const userData = {
        username: 'duplicate',
        password: 'password123',
        name: 'First User',
        email: 'first@test.com',
        role: 'student',
        regNo: 'ST001'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same username should fail
      const duplicateData = {
        ...userData,
        email: 'second@test.com',
        regNo: 'ST002'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    test('validates required fields', async () => {
      const incompleteData = {
        username: 'incomplete',
        password: 'password123'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
    });

    test('enforces password strength requirements', async () => {
      const weakPasswordData = {
        username: 'weakpass',
        password: '123', // Too short
        name: 'Weak Password User',
        email: 'weak@test.com',
        role: 'student',
        regNo: 'ST001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('password');
    });
  });

  describe('User Login', () => {
    let testUser;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        username: 'logintest',
        password: hashedPassword,
        name: 'Login Test User',
        email: 'login@test.com',
        role: 'student',
        regNo: 'ST001'
      });
    });

    test('successful login returns user and token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user._id).toBe(String(testUser._id));
      expect(response.body.user.password).toBeUndefined();
    });

    test('login with incorrect password fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('login with non-existent username fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('login with missing credentials fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Token Validation and User Profile', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        username: 'tokentest',
        password: hashedPassword,
        name: 'Token Test User',
        email: 'token@test.com',
        role: 'student',
        regNo: 'ST001'
      });

      // Get valid token by logging in
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'tokentest',
          password: 'password123'
        });

      validToken = loginResponse.body.token;
    });

    test('valid token returns user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(String(testUser._id));
      expect(response.body.username).toBe('tokentest');
      expect(response.body.password).toBeUndefined();
    });

    test('missing token returns unauthorized', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    test('invalid token returns unauthorized', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token.');
    });

    test('malformed authorization header returns unauthorized', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('Role-Based Access Control', () => {
    let studentUser, academicUser;
    let studentToken, academicToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      studentUser = await User.create({
        username: 'student',
        password: hashedPassword,
        name: 'Student User',
        email: 'student@test.com',
        role: 'student',
        regNo: 'ST001'
      });

      academicUser = await User.create({
        username: 'academic',
        password: hashedPassword,
        name: 'Academic User',
        email: 'academic@test.com',
        role: 'academic',
        department: 'Computer Science'
      });

      // Get tokens
      const studentLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'student', password: 'password123' });
      studentToken = studentLogin.body.token;

      const academicLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'academic', password: 'password123' });
      academicToken = academicLogin.body.token;
    });

    test('student token has correct role', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('student');
      expect(response.body.regNo).toBe('ST001');
    });

    test('academic token has correct role', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${academicToken}`);

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('academic');
      expect(response.body.department).toBe('Computer Science');
    });
  });

  describe('Security Headers and Features', () => {
    test('login response includes security headers', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'securitytest',
        password: hashedPassword,
        name: 'Security Test User',
        email: 'security@test.com',
        role: 'student',
        regNo: 'ST001'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'securitytest',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('password is properly hashed in database', async () => {
      const userData = {
        username: 'hashtest',
        password: 'password123',
        name: 'Hash Test User',
        email: 'hash@test.com',
        role: 'student',
        regNo: 'ST001'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const user = await User.findOne({ username: 'hashtest' });
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });
  });

  describe('Error Handling', () => {
    test('database connection error handling', async () => {
      // Temporarily close connection
      await mongoose.connection.close();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test',
          password: 'password123'
        });

      expect(response.status).toBe(500);

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    test('malformed JSON request handling', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });
});
