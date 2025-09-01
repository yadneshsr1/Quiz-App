const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quiz-app');
    console.log('Connected to MongoDB');

    // Create test users
    const testUsers = [
      {
        username: 'academic1',
        password: 'password123',
        role: 'academic',
        name: 'Dr. John Smith',
        email: 'john.smith@university.edu',
        department: 'Computer Science'
      },
      {
        username: 'student1',
        password: 'password123',
        role: 'student',
        name: 'Alice Johnson',
        email: 'alice.johnson@student.edu',
        regNo: '2023001',
        course: 'Computer Science',
        moduleCode: 'CS101'
      }
    ];

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findOne({ username: userData.username });
        if (!existingUser) {
          const user = new User(userData);
          await user.save();
          console.log(`Created user: ${userData.username} (${userData.role})`);
        } else {
          console.log(`User ${userData.username} already exists`);
        }
      } catch (error) {
        console.error(`Error creating user ${userData.username}:`, error.message);
      }
    }

    console.log('\nTest users created successfully!');
    console.log('You can now login with:');
    console.log('- Academic: username: academic1, password: password123');
    console.log('- Student: username: student1, password: password123');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAuth(); 