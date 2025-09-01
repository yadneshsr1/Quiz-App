const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function setupTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/quiz-app"
    );
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create academic users
    const academics = [
      {
        username: "academic1",
        password: "password123",
        role: "academic",
        name: "Dr. John Smith",
        email: "john.smith@university.edu",
        department: "Computer Science",
      },
      {
        username: "academic2",
        password: "password123",
        role: "academic",
        name: "Dr. Sarah Wilson",
        email: "sarah.wilson@university.edu",
        department: "Computer Science",
      },
    ];

    // Create student users
    const students = [
      {
        username: "student1",
        password: "password123",
        role: "student",
        name: "Alice Johnson",
        email: "alice.johnson@student.edu",
        regNo: "2023001",
        course: "Computer Science",
      },
      {
        username: "student2",
        password: "password123",
        role: "student",
        name: "Bob Williams",
        email: "bob.williams@student.edu",
        regNo: "2023002",
        course: "Computer Science",
      },
      {
        username: "student3",
        password: "password123",
        role: "student",
        name: "Charlie Brown",
        email: "charlie.brown@student.edu",
        regNo: "2023003",
        course: "Computer Science",
      },
      {
        username: "student4",
        password: "password123",
        role: "student",
        name: "Diana Martinez",
        email: "diana.martinez@student.edu",
        regNo: "2023004",
        course: "Computer Science",
      },
      {
        username: "student5",
        password: "password123",
        role: "student",
        name: "Ethan Lee",
        email: "ethan.lee@student.edu",
        regNo: "2023005",
        course: "Computer Science",
      },
    ];

    // Save users with plain text passwords
    for (const userData of [...academics, ...students]) {
      try {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.username} (${userData.role})`);
      } catch (error) {
        console.error(
          `Error creating user ${userData.username}:`,
          error.message
        );
      }
    }

    console.log("\nTest users created successfully!");
    console.log("\nAcademic Users:");
    academics.forEach((user) => {
      console.log(`- Username: ${user.username}, Password: ${user.password}`);
    });
    console.log("\nStudent Users:");
    students.forEach((user) => {
      console.log(`- Username: ${user.username}, Password: ${user.password}`);
    });

    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

setupTestUsers();
