/**
 * API Integration Tests
 * Tests complete API workflows and endpoint interactions
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models and routes
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');
const authRoutes = require('../routes/authRoutes');
const quizRoutes = require('../routes/quizRoutes');
const resultRoutes = require('../routes/resultRoutes');

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
  app.use('/api/results', resultRoutes);
  
  // Create test users
  studentUser = await User.create({
    username: 'integrationstudent',
    password: 'password123',
    name: 'Integration Test Student',
    email: 'integration@student.com',
    role: 'student',
    regNo: 'INT001'
  });
  
  academicUser = await User.create({
    username: 'integrationacademic',
    password: 'password123',
    name: 'Integration Test Academic',
    email: 'integration@academic.com',
    role: 'academic',
    department: 'Computer Science'
  });
  
  // Get authentication tokens
  const studentLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'integrationstudent', password: 'password123' });
  studentToken = studentLogin.body.token;
  
  const academicLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'integrationacademic', password: 'password123' });
  academicToken = academicLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean up test data before each test
  await Quiz.deleteMany({});
  await Question.deleteMany({});
  await Result.deleteMany({});
});

describe('API Integration Tests', () => {
  
  describe('Complete Quiz Creation Workflow', () => {
    test('academic can create quiz with questions', async () => {
      // Step 1: Create quiz
      const quizData = {
        title: 'Integration Test Quiz',
        description: 'Test quiz for integration testing',
        moduleCode: 'INT101',
        duration: 60,
        startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        endTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        assignedStudentIds: [studentUser._id]
      };

      const quizResponse = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${academicToken}`)
        .send(quizData);

      expect(quizResponse.status).toBe(201);
      expect(quizResponse.body.title).toBe('Integration Test Quiz');
      
      const quizId = quizResponse.body._id;

      // Step 2: Add questions to quiz
      const questionData = {
        questionText: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswerIndex: 2,
        feedback: 'Paris is the capital city of France.'
      };

      const questionResponse = await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${academicToken}`)
        .send(questionData);

      expect(questionResponse.status).toBe(201);
      expect(questionResponse.body.questionText).toBe('What is the capital of France?');

      // Step 3: Verify quiz has questions
      const questionsResponse = await request(app)
        .get(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${academicToken}`);

      expect(questionsResponse.status).toBe(200);
      expect(questionsResponse.body).toHaveLength(1);
      expect(questionsResponse.body[0].questionText).toBe('What is the capital of France?');
    });

    test('student cannot create quiz', async () => {
      const quizData = {
        title: 'Unauthorized Quiz',
        moduleCode: 'UNAUTH101'
      };

      const response = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(quizData);

      expect(response.status).toBe(403);
    });
  });

  describe('Complete Quiz Taking Workflow', () => {
    let testQuiz;
    let testQuestion;

    beforeEach(async () => {
      // Create quiz
      testQuiz = await Quiz.create({
        title: 'Quiz Taking Test',
        description: 'Test quiz for taking workflow',
        moduleCode: 'TAKE101',
        duration: 60,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });

      // Create question
      testQuestion = await Question.create({
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswerIndex: 1,
        answerKey: 1,
        feedback: '2 + 2 equals 4.',
        quizId: testQuiz._id
      });
    });

    test('complete quiz taking flow succeeds', async () => {
      // Step 1: Get eligible quizzes
      const eligibleResponse = await request(app)
        .get('/api/quizzes/eligible')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(eligibleResponse.status).toBe(200);
      expect(eligibleResponse.body).toHaveLength(1);
      expect(eligibleResponse.body[0]._id).toBe(String(testQuiz._id));

      // Step 2: Launch quiz to get ticket
      const launchResponse = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(launchResponse.status).toBe(200);
      expect(launchResponse.body.ticket).toBeDefined();

      const launchTicket = launchResponse.body.ticket;

      // Step 3: Start quiz with ticket
      const startResponse = await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', launchTicket);

      expect(startResponse.status).toBe(200);
      expect(startResponse.body.quiz).toBeDefined();
      expect(startResponse.body.quiz.title).toBe('Quiz Taking Test');

      // Step 4: Submit quiz answers
      const submissionData = {
        quizId: testQuiz._id,
        answers: {
          [testQuestion._id]: 1 // Correct answer
        },
        timeSpent: 30
      };

      const submitResponse = await request(app)
        .post('/api/results/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submissionData);

      expect(submitResponse.status).toBe(201);
      expect(submitResponse.body.result).toBeDefined();
      expect(submitResponse.body.result.score).toBe(100); // 100% correct

      // Step 5: Verify quiz no longer appears in eligible list
      const eligibleAfterResponse = await request(app)
        .get('/api/quizzes/eligible')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(eligibleAfterResponse.status).toBe(200);
      expect(eligibleAfterResponse.body).toHaveLength(0);
    });

    test('quiz submission with wrong answers calculates score correctly', async () => {
      // Launch and start quiz
      const launchResponse = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      const launchTicket = launchResponse.body.ticket;

      await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', launchTicket);

      // Submit with wrong answer
      const submissionData = {
        quizId: testQuiz._id,
        answers: {
          [testQuestion._id]: 0 // Wrong answer (should be 1)
        },
        timeSpent: 45
      };

      const submitResponse = await request(app)
        .post('/api/results/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submissionData);

      expect(submitResponse.status).toBe(201);
      expect(submitResponse.body.result.score).toBe(0); // 0% correct
      expect(submitResponse.body.result.correctAnswers).toBe(0);
      expect(submitResponse.body.result.totalQuestions).toBe(1);
    });
  });

  describe('Quiz Analytics Workflow', () => {
    let testQuiz;
    let testQuestion;

    beforeEach(async () => {
      testQuiz = await Quiz.create({
        title: 'Analytics Test Quiz',
        moduleCode: 'ANAL101',
        duration: 60,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });

      testQuestion = await Question.create({
        questionText: 'Analytics test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 2,
        answerKey: 2,
        feedback: 'C is correct.',
        quizId: testQuiz._id
      });
    });

    test('analytics show correct data after submission', async () => {
      // Submit quiz result
      await Result.create({
        quizId: testQuiz._id,
        studentId: studentUser._id,
        answers: { [testQuestion._id]: 2 }, // Correct answer
        score: 100,
        correctAnswers: 1,
        totalQuestions: 1,
        timeSpent: 30,
        submittedAt: new Date()
      });

      // Get analytics
      const analyticsResponse = await request(app)
        .get(`/api/results/quiz/${testQuiz._id}/analytics`)
        .set('Authorization', `Bearer ${academicToken}`);

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.summary).toBeDefined();
      expect(analyticsResponse.body.summary.totalSubmissions).toBe(1);
      expect(analyticsResponse.body.summary.averageScore).toBe(100);
      expect(analyticsResponse.body.results).toHaveLength(1);
    });

    test('student cannot access quiz analytics', async () => {
      const response = await request(app)
        .get(`/api/results/quiz/${testQuiz._id}/analytics`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling in Workflows', () => {
    test('invalid quiz ID handling', async () => {
      const invalidQuizId = '507f1f77bcf86cd799439999';
      
      const response = await request(app)
        .post(`/api/quizzes/${invalidQuizId}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Quiz not found');
    });

    test('malformed request data handling', async () => {
      const testQuiz = await Quiz.create({
        title: 'Error Test Quiz',
        moduleCode: 'ERR101',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });

      const malformedData = {
        // Missing required fields
        answers: 'not-an-object',
        timeSpent: 'not-a-number'
      };

      const response = await request(app)
        .post('/api/results/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(malformedData);

      expect(response.status).toBe(400);
    });
  });

  describe('Concurrent Operations', () => {
    let testQuiz;

    beforeEach(async () => {
      testQuiz = await Quiz.create({
        title: 'Concurrency Test Quiz',
        moduleCode: 'CONC101',
        duration: 60,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });

      await Question.create({
        questionText: 'Concurrency test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 1,
        answerKey: 1,
        quizId: testQuiz._id
      });
    });

    test('concurrent quiz submissions are handled correctly', async () => {
      // Launch and start quiz
      const launchResponse = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/launch`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      const launchTicket = launchResponse.body.ticket;

      await request(app)
        .get(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-quiz-launch', launchTicket);

      const submissionData = {
        quizId: testQuiz._id,
        answers: {},
        timeSpent: 30
      };

      // Fire concurrent submissions
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

      // One should succeed, one should be rejected as duplicate
      const responses = [response1, response2];
      const successResponses = responses.filter(r => r.status === 201);
      const conflictResponses = responses.filter(r => r.status === 409);

      expect(successResponses).toHaveLength(1);
      expect(conflictResponses).toHaveLength(1);
      expect(conflictResponses[0].body.error).toBe('Quiz already submitted');
    });
  });

  describe('Data Consistency', () => {
    test('quiz deletion removes associated questions', async () => {
      // Create quiz with question
      const quiz = await Quiz.create({
        title: 'Deletion Test Quiz',
        moduleCode: 'DEL101',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        createdBy: academicUser._id
      });

      const question = await Question.create({
        questionText: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 0,
        answerKey: 0,
        quizId: quiz._id
      });

      // Delete quiz
      const deleteResponse = await request(app)
        .delete(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${academicToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify question is also deleted (if cascade delete is implemented)
      const remainingQuestions = await Question.find({ quizId: quiz._id });
      expect(remainingQuestions).toHaveLength(0);
    });
  });

  describe('Performance Under Load', () => {
    test('multiple concurrent quiz launches', async () => {
      const quiz = await Quiz.create({
        title: 'Load Test Quiz',
        moduleCode: 'LOAD101',
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
        assignedStudentIds: [studentUser._id],
        createdBy: academicUser._id
      });

      const launchPromises = [];
      for (let i = 0; i < 10; i++) {
        launchPromises.push(
          request(app)
            .post(`/api/quizzes/${quiz._id}/launch`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({})
        );
      }

      const responses = await Promise.all(launchPromises);
      
      // All launches should succeed and return unique tickets
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.ticket).toBeDefined();
      });

      // Verify all tickets are unique
      const tickets = responses.map(r => r.body.ticket);
      const uniqueTickets = [...new Set(tickets)];
      expect(uniqueTickets).toHaveLength(tickets.length);
    });
  });
});
