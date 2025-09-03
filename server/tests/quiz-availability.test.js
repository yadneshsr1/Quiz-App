/**
 * Quiz Availability Tests
 * Tests the core invariant: A quiz is Available iff student is assigned, 
 * within time window, and has no submitted Result
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');

// Import routes
const authRoutes = require('../routes/authRoutes');
const quizRoutes = require('../routes/quizRoutes');
const resultRoutes = require('../routes/resultRoutes');
const debugRoutes = require('../routes/debugRoutes');

let mongoServer;
let app;
let studentUser, academicUser;
let studentToken, academicToken;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // Setup Express app
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/results', resultRoutes);
  app.use('/api/debug', debugRoutes);
  
  // Create test users
  studentUser = await User.create({
    username: 'teststudent',
    password: 'password123',
    name: 'Test Student',
    email: 'student@test.com',
    role: 'student',
    regNo: 'TEST001'
  });
  
  academicUser = await User.create({
    username: 'testacademic',
    password: 'password123',
    name: 'Test Academic',
    email: 'academic@test.com',
    role: 'academic',
    department: 'Computer Science'
  });
  
  // Get auth tokens
  const studentLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'teststudent', password: 'password123' });
  studentToken = studentLogin.body.token;
  
  const academicLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'testacademic', password: 'password123' });
  academicToken = academicLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up test data
  await Quiz.deleteMany({});
  await Result.deleteMany({});
});

describe('Quiz Availability Core Invariant', () => {
  
  test('Available quiz appears in eligible list', async () => {
    // Create quiz assigned to student, within time window
    const quiz = await Quiz.create({
      title: 'Test Quiz',
      description: 'Test Description',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      endTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      assignedStudentIds: [studentUser._id],
      createdBy: academicUser._id
    });
    
    const response = await request(app)
      .get('/api/quizzes/eligible')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]._id).toBe(String(quiz._id));
  });
  
  test('Quiz disappears after submission', async () => {
    // Create quiz
    const quiz = await Quiz.create({
      title: 'Test Quiz',
      description: 'Test Description', 
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [studentUser._id],
      createdBy: academicUser._id
    });
    
    // Check quiz is available before submission
    let response = await request(app)
      .get('/api/quizzes/eligible')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]._id).toBe(String(quiz._id));
    
    // Submit quiz
    const submitResponse = await request(app)
      .post('/api/results/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        quizId: quiz._id,
        answers: {},
        timeSpent: 30
      });
    
    expect(submitResponse.status).toBe(201);
    
    // Check quiz is no longer available
    response = await request(app)
      .get('/api/quizzes/eligible')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
  
  test('Idempotent submission - duplicate POSTs create only one Result', async () => {
    const quiz = await Quiz.create({
      title: 'Test Quiz',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [studentUser._id],
      createdBy: academicUser._id
    });
    
    const submissionData = {
      quizId: quiz._id,
      answers: { 'q1': 0 },
      timeSpent: 30
    };
    
    // First submission
    const response1 = await request(app)
      .post('/api/results/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(submissionData);
    
    expect(response1.status).toBe(201);
    
    // Second submission (duplicate)
    const response2 = await request(app)
      .post('/api/results/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(submissionData);
    
    expect(response2.status).toBe(409);
    expect(response2.body.error).toBe('Quiz already submitted');
    
    // Verify only one Result exists
    const results = await Result.find({ studentId: studentUser._id, quizId: quiz._id });
    expect(results).toHaveLength(1);
  });
  
  test('Race condition protection - concurrent submissions', async () => {
    const quiz = await Quiz.create({
      title: 'Test Quiz',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [studentUser._id],
      createdBy: academicUser._id
    });
    
    const submissionData = {
      quizId: quiz._id,
      answers: { 'q1': 0 },
      timeSpent: 30
    };
    
    // Fire two concurrent requests
    const [response1, response2] = await Promise.all([
      request(app)
        .post('/api/results/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submissionData),
      request(app)
        .post('/api/results/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submissionData)
    ]);
    
    // One should succeed, one should fail
    const responses = [response1, response2];
    const successResponses = responses.filter(r => r.status === 201);
    const conflictResponses = responses.filter(r => r.status === 409);
    
    expect(successResponses).toHaveLength(1);
    expect(conflictResponses).toHaveLength(1);
    
    // Verify only one Result exists
    const results = await Result.find({ studentId: studentUser._id, quizId: quiz._id });
    expect(results).toHaveLength(1);
  });
  
  test('Analytics shows submission immediately', async () => {
    const quiz = await Quiz.create({
      title: 'Test Quiz',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [studentUser._id],
      createdBy: academicUser._id
    });
    
    // Submit quiz
    await request(app)
      .post('/api/results/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        quizId: quiz._id,
        answers: {},
        timeSpent: 45
      });
    
    // Check analytics immediately
    const analyticsResponse = await request(app)
      .get(`/api/results/quiz/${quiz._id}/analytics`)
      .set('Authorization', `Bearer ${academicToken}`);
    
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.body.summary.totalSubmissions).toBe(1);
    expect(analyticsResponse.body.results).toHaveLength(1);
  });
  
  test('Debug endpoint shows correct availability reasoning', async () => {
    const quiz = await Quiz.create({
      title: 'Test Quiz',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [studentUser._id],
      createdBy: academicUser._id
    });
    
    // Check debug before submission
    let debugResponse = await request(app)
      .get(`/api/debug/availability?studentId=${studentUser._id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(debugResponse.status).toBe(200);
    const quizAnalysis = debugResponse.body.quizzes.find(q => q.quizId === String(quiz._id));
    expect(quizAnalysis.isAvailable).toBe(true);
    expect(quizAnalysis.reasons.submissionOk.passed).toBe(true);
    expect(quizAnalysis.reasons.submissionOk.hasSubmission).toBe(false);
    
    // Submit quiz
    await request(app)
      .post('/api/results/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        quizId: quiz._id,
        answers: {},
        timeSpent: 30
      });
    
    // Check debug after submission
    debugResponse = await request(app)
      .get(`/api/debug/availability?studentId=${studentUser._id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(debugResponse.status).toBe(200);
    const quizAnalysisAfter = debugResponse.body.quizzes.find(q => q.quizId === String(quiz._id));
    expect(quizAnalysisAfter.isAvailable).toBe(false);
    expect(quizAnalysisAfter.reasons.submissionOk.passed).toBe(false);
    expect(quizAnalysisAfter.reasons.submissionOk.hasSubmission).toBe(true);
  });
  
});

describe('Time Window and Assignment Rules', () => {
  
  test('Quiz outside time window is not available', async () => {
    // Create quiz that ended 1 hour ago
    const quiz = await Quiz.create({
      title: 'Expired Quiz',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      assignedStudentIds: [studentUser._id],
      createdBy: academicUser._id
    });
    
    const response = await request(app)
      .get('/api/quizzes/eligible')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
  
  test('Quiz not assigned to student is not available', async () => {
    // Create another student
    const otherStudent = await User.create({
      username: 'otherstudent',
      password: 'password123',
      name: 'Other Student',
      email: 'other@test.com',
      role: 'student',
      regNo: 'TEST002'
    });
    
    // Create quiz assigned only to other student
    const quiz = await Quiz.create({
      title: 'Private Quiz',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [otherStudent._id], // Not assigned to main test student
      createdBy: academicUser._id
    });
    
    const response = await request(app)
      .get('/api/quizzes/eligible')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
  
  test('Public quiz (no assignments) is available to all students', async () => {
    const quiz = await Quiz.create({
      title: 'Public Quiz',
      moduleCode: 'TEST101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [], // Empty array = public
      createdBy: academicUser._id
    });
    
    const response = await request(app)
      .get('/api/quizzes/eligible')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]._id).toBe(String(quiz._id));
  });
  
});
