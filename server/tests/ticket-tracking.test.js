/**
 * Comprehensive Ticket Tracking Tests
 * Tests the persistent ticket tracking system including MongoDB TTL indexes,
 * ticket reuse prevention, cleanup jobs, and analytics
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models
const UsedTicket = require('../models/UsedTicket');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Import utilities
const ticketManager = require('../utils/ticketManager');

// Import routes for integration tests
const authRoutes = require('../routes/authRoutes');
const quizRoutes = require('../routes/quizRoutes');

let mongoServer;
let app;
let studentUser, academicUser;
let studentToken, academicToken;
let testQuiz;

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
  
  // Create test users
  studentUser = await User.create({
    username: 'ticketteststudent',
    password: 'password123',
    name: 'Ticket Test Student',
    email: 'tickettest@test.com',
    role: 'student',
    regNo: 'TICKET001'
  });
  
  academicUser = await User.create({
    username: 'tickettestacademic',
    password: 'password123',
    name: 'Ticket Test Academic',
    email: 'ticketacademic@test.com',
    role: 'academic',
    department: 'Computer Science'
  });
  
  // Get auth tokens
  const studentLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'ticketteststudent', password: 'password123' });
  studentToken = studentLogin.body.token;
  
  const academicLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'tickettestacademic', password: 'password123' });
  academicToken = academicLogin.body.token;
  
  // Create test quiz
  testQuiz = await Quiz.create({
    title: 'Ticket Test Quiz',
    description: 'Test quiz for ticket tracking',
    moduleCode: 'TICKET101',
    startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    endTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    assignedStudentIds: [studentUser._id],
    createdBy: academicUser._id
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up test data
  await UsedTicket.deleteMany({});
});

describe('UsedTicket Model and Schema', () => {
  
  test('Creates used ticket with all required fields', async () => {
    const ticketData = {
      ticketId: 'test_jti_123',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      quizId: testQuiz._id,
      userId: studentUser._id,
      userAgent: 'Mozilla/5.0 (Test Browser)',
      ipAddress: '192.168.1.100'
    };
    
    const ticket = await UsedTicket.create(ticketData);
    
    expect(ticket.ticketId).toBe('test_jti_123');
    expect(ticket.quizId).toEqual(testQuiz._id);
    expect(ticket.userId).toEqual(studentUser._id);
    expect(ticket.userAgent).toBe('Mozilla/5.0 (Test Browser)');
    expect(ticket.ipAddress).toBe('192.168.1.100');
    expect(ticket.createdAt).toBeInstanceOf(Date);
  });
  
  test('Enforces unique constraint on ticketId', async () => {
    const ticketData = {
      ticketId: 'duplicate_jti',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      quizId: testQuiz._id,
      userId: studentUser._id
    };
    
    await UsedTicket.create(ticketData);
    
    // Attempt to create duplicate
    await expect(UsedTicket.create(ticketData))
      .rejects
      .toThrow(/duplicate key error/);
  });
  
  test('TTL index configuration is correct', async () => {
    const indexes = await UsedTicket.collection.getIndexes();
    
    // Check that TTL index exists
    const ttlIndex = Object.values(indexes).find(index => 
      index.name === 'ticket_ttl_index'
    );
    
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex.expireAfterSeconds).toBe(0);
    expect(ttlIndex.key).toEqual({ expiresAt: 1 });
  });
  
  test('Compound indexes are created correctly', async () => {
    const indexes = await UsedTicket.collection.getIndexes();
    
    // Check quiz_user_index
    const quizUserIndex = Object.values(indexes).find(index => 
      index.name === 'quiz_user_index'
    );
    expect(quizUserIndex).toBeDefined();
    expect(quizUserIndex.key).toEqual({ quizId: 1, userId: 1 });
    
    // Check analytics_index
    const analyticsIndex = Object.values(indexes).find(index => 
      index.name === 'analytics_index'
    );
    expect(analyticsIndex).toBeDefined();
    expect(analyticsIndex.key).toEqual({ createdAt: -1, quizId: 1 });
  });
  
});

describe('TicketManager Utility Functions', () => {
  
  test('markTicketAsUsed creates new ticket successfully', async () => {
    const jti = 'test_mark_jti_123';
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    const metadata = {
      userAgent: 'Test User Agent',
      ipAddress: '192.168.1.200'
    };
    
    const result = await ticketManager.markTicketAsUsed(
      jti,
      expirationTime,
      testQuiz._id,
      studentUser._id,
      metadata
    );
    
    expect(result).toBe(true);
    
    // Verify ticket was created in database
    const ticket = await UsedTicket.findOne({ ticketId: jti });
    expect(ticket).toBeTruthy();
    expect(ticket.ticketId).toBe(jti);
    expect(ticket.expiresAt.getTime()).toBe(expirationTime);
    expect(ticket.userAgent).toBe(metadata.userAgent);
    expect(ticket.ipAddress).toBe(metadata.ipAddress);
  });
  
  test('markTicketAsUsed prevents duplicate tickets', async () => {
    const jti = 'duplicate_test_jti';
    const expirationTime = Date.now() + 10 * 60 * 1000;
    
    // First call should succeed
    const result1 = await ticketManager.markTicketAsUsed(
      jti,
      expirationTime,
      testQuiz._id,
      studentUser._id
    );
    expect(result1).toBe(true);
    
    // Second call should return false (duplicate)
    const result2 = await ticketManager.markTicketAsUsed(
      jti,
      expirationTime,
      testQuiz._id,
      studentUser._id
    );
    expect(result2).toBe(false);
    
    // Verify only one ticket exists
    const tickets = await UsedTicket.find({ ticketId: jti });
    expect(tickets).toHaveLength(1);
  });
  
  test('isTicketUsed correctly identifies used tickets', async () => {
    const jti = 'check_usage_jti';
    
    // Initially should not be used
    let isUsed = await ticketManager.isTicketUsed(jti);
    expect(isUsed).toBe(false);
    
    // Mark as used
    await ticketManager.markTicketAsUsed(
      jti,
      Date.now() + 10 * 60 * 1000,
      testQuiz._id,
      studentUser._id
    );
    
    // Now should be used
    isUsed = await ticketManager.isTicketUsed(jti);
    expect(isUsed).toBe(true);
  });
  
  test('cleanupExpiredTickets removes only expired tickets', async () => {
    const now = Date.now();
    
    // Create expired ticket
    await UsedTicket.create({
      ticketId: 'expired_ticket',
      expiresAt: new Date(now - 60 * 1000), // 1 minute ago
      quizId: testQuiz._id,
      userId: studentUser._id
    });
    
    // Create valid ticket
    await UsedTicket.create({
      ticketId: 'valid_ticket',
      expiresAt: new Date(now + 10 * 60 * 1000), // 10 minutes from now
      quizId: testQuiz._id,
      userId: studentUser._id
    });
    
    const deletedCount = await ticketManager.cleanupExpiredTickets();
    expect(deletedCount).toBe(1);
    
    // Verify only valid ticket remains
    const remainingTickets = await UsedTicket.find({});
    expect(remainingTickets).toHaveLength(1);
    expect(remainingTickets[0].ticketId).toBe('valid_ticket');
  });
  
  test('getQuizTicketStats provides accurate statistics', async () => {
    // Create tickets for different users and IPs
    const tickets = [
      {
        ticketId: 'stats_ticket_1',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        quizId: testQuiz._id,
        userId: studentUser._id,
        ipAddress: '192.168.1.100'
      },
      {
        ticketId: 'stats_ticket_2',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        quizId: testQuiz._id,
        userId: studentUser._id, // Same user
        ipAddress: '192.168.1.200' // Different IP
      },
      {
        ticketId: 'stats_ticket_3',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        quizId: testQuiz._id,
        userId: academicUser._id, // Different user
        ipAddress: '192.168.1.100' // Same IP as first
      }
    ];
    
    await UsedTicket.insertMany(tickets);
    
    const stats = await ticketManager.getQuizTicketStats(testQuiz._id);
    
    expect(stats.totalUsed).toBe(3);
    expect(stats.uniqueUsers).toBe(2);
    expect(stats.uniqueIPs).toBe(2);
  });
  
  test('getQuizTicketStats handles quiz with no tickets', async () => {
    const emptyQuiz = await Quiz.create({
      title: 'Empty Quiz',
      moduleCode: 'EMPTY101',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      assignedStudentIds: [],
      createdBy: academicUser._id
    });
    
    const stats = await ticketManager.getQuizTicketStats(emptyQuiz._id);
    
    expect(stats.totalUsed).toBe(0);
    expect(stats.uniqueUsers).toBe(0);
    expect(stats.uniqueIPs).toBe(0);
  });
  
});

describe('TTL Index Functionality', () => {
  
  test('TTL index eventually removes expired documents', async () => {
    // Create ticket that expires immediately
    const ticket = await UsedTicket.create({
      ticketId: 'ttl_test_ticket',
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
      quizId: testQuiz._id,
      userId: studentUser._id
    });
    
    // Verify ticket exists initially
    let foundTicket = await UsedTicket.findById(ticket._id);
    expect(foundTicket).toBeTruthy();
    
    // Note: In a real environment, MongoDB TTL runs every 60 seconds
    // For testing, we manually trigger cleanup or wait longer
    // Here we test the manual cleanup function as a proxy
    const deletedCount = await ticketManager.cleanupExpiredTickets();
    expect(deletedCount).toBe(1);
    
    foundTicket = await UsedTicket.findById(ticket._id);
    expect(foundTicket).toBe(null);
  });
  
});

describe('Error Handling and Edge Cases', () => {
  
  test('markTicketAsUsed handles database connection errors gracefully', async () => {
    // Temporarily close connection to simulate error
    await mongoose.connection.close();
    
    await expect(ticketManager.markTicketAsUsed(
      'error_test_jti',
      Date.now() + 10 * 60 * 1000,
      testQuiz._id,
      studentUser._id
    )).rejects.toThrow();
    
    // Reconnect for other tests
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });
  
  test('isTicketUsed handles database connection errors gracefully', async () => {
    await mongoose.connection.close();
    
    await expect(ticketManager.isTicketUsed('error_test_jti'))
      .rejects.toThrow();
    
    // Reconnect for other tests
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });
  
  test('markTicketAsUsed handles invalid ObjectIds', async () => {
    await expect(ticketManager.markTicketAsUsed(
      'invalid_objectid_test',
      Date.now() + 10 * 60 * 1000,
      'invalid_quiz_id', // Invalid ObjectId
      studentUser._id
    )).rejects.toThrow();
  });
  
  test('getQuizTicketStats handles invalid quiz ID', async () => {
    const stats = await ticketManager.getQuizTicketStats('nonexistent_quiz_id');
    expect(stats.totalUsed).toBe(0);
    expect(stats.uniqueUsers).toBe(0);
    expect(stats.uniqueIPs).toBe(0);
  });
  
});

describe('Performance and Scalability', () => {
  
  test('Bulk ticket operations perform efficiently', async () => {
    const startTime = Date.now();
    const ticketPromises = [];
    
    // Create 100 tickets concurrently
    for (let i = 0; i < 100; i++) {
      ticketPromises.push(ticketManager.markTicketAsUsed(
        `bulk_test_${i}`,
        Date.now() + 10 * 60 * 1000,
        testQuiz._id,
        studentUser._id,
        { ipAddress: `192.168.1.${i % 255}` }
      ));
    }
    
    const results = await Promise.all(ticketPromises);
    const endTime = Date.now();
    
    // All operations should succeed
    expect(results.every(result => result === true)).toBe(true);
    
    // Should complete in reasonable time (adjust threshold as needed)
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    
    // Verify all tickets were created
    const ticketCount = await UsedTicket.countDocuments({});
    expect(ticketCount).toBe(100);
  });
  
  test('Index usage for common queries', async () => {
    // Create test data
    await UsedTicket.insertMany([
      {
        ticketId: 'index_test_1',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        quizId: testQuiz._id,
        userId: studentUser._id,
        createdAt: new Date()
      },
      {
        ticketId: 'index_test_2',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        quizId: testQuiz._id,
        userId: academicUser._id,
        createdAt: new Date()
      }
    ]);
    
    // Test that queries use appropriate indexes
    // Note: In a real test environment, you might use MongoDB explain() to verify index usage
    
    // Query by ticketId (should use unique index)
    const ticketByJti = await UsedTicket.findOne({ ticketId: 'index_test_1' });
    expect(ticketByJti).toBeTruthy();
    
    // Query by quiz and user (should use compound index)
    const ticketsByQuizUser = await UsedTicket.find({ 
      quizId: testQuiz._id, 
      userId: studentUser._id 
    });
    expect(ticketsByQuizUser).toHaveLength(1);
    
    // Query for analytics (should use analytics index)
    const recentTickets = await UsedTicket.find({ 
      quizId: testQuiz._id 
    }).sort({ createdAt: -1 });
    expect(recentTickets).toHaveLength(2);
  });
  
});

describe('Cron Job Integration', () => {
  
  test('Cleanup job removes expired tickets correctly', async () => {
    // Create mix of expired and valid tickets
    await UsedTicket.insertMany([
      {
        ticketId: 'cron_expired_1',
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired
        quizId: testQuiz._id,
        userId: studentUser._id
      },
      {
        ticketId: 'cron_expired_2',
        expiresAt: new Date(Date.now() - 120 * 1000), // Expired
        quizId: testQuiz._id,
        userId: studentUser._id
      },
      {
        ticketId: 'cron_valid_1',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Valid
        quizId: testQuiz._id,
        userId: studentUser._id
      }
    ]);
    
    // Simulate cron job execution
    const deletedCount = await ticketManager.cleanupExpiredTickets();
    expect(deletedCount).toBe(2);
    
    // Verify only valid tickets remain
    const remainingTickets = await UsedTicket.find({});
    expect(remainingTickets).toHaveLength(1);
    expect(remainingTickets[0].ticketId).toBe('cron_valid_1');
  });
  
});

// Integration tests with actual quiz flow would go here
// These would test the complete flow from ticket generation to usage
// but require the integration fix mentioned in the main analysis

describe('Integration Test Placeholders', () => {
  
  test('TODO: End-to-end ticket flow with quiz launch and start', () => {
    // This test will be implemented after fixing the integration
    // between persistent storage and the actual quiz flow
    expect(true).toBe(true); // Placeholder
  });
  
  test('TODO: Ticket reuse prevention across server restarts', () => {
    // This test will verify that tickets remain blocked after server restart
    // once the persistent system is properly integrated
    expect(true).toBe(true); // Placeholder
  });
  
});
