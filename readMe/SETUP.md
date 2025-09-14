# Quiz App Setup Guide

## Quick Setup Instructions

### 1. Fix PowerShell Execution Policy (Windows)

If you're getting PowerShell execution policy errors, run this in PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or use Command Prompt instead of PowerShell.

### 2. Create Environment File

Create a file named `.env` in the `server` directory with this content:

```env
MONGO_URI=mongodb://localhost:27017/quiz-app
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
PORT=5000
```

### 3. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running on your system. If you don't have it installed:
- Download from: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud version)

### 5. Create Test Users

Run this command in the server directory:
```bash
node test-auth.js
```

This will create test users:
- **Academic**: username: `academic1`, password: `password123`
- **Student**: username: `student1`, password: `password123`

### 6. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### 7. Test the Application

1. Open your browser to `http://localhost:3000`
2. You'll be redirected to the login page
3. Use the test credentials above to login
4. You'll be redirected to the appropriate dashboard based on your role

## Troubleshooting

### PowerShell Issues
- Use Command Prompt instead of PowerShell
- Or run PowerShell as Administrator and change execution policy

### MongoDB Connection Issues
- Make sure MongoDB is running
- Check if the connection string is correct in `.env`
- Try using MongoDB Atlas if local setup is problematic

### Port Issues
- Make sure ports 3000 and 5000 are available
- Check if other applications are using these ports

## Next Steps

After successful setup, you can:
1. Create quizzes as an academic user
2. Take quizzes as a student user
3. View results and manage the system

The authentication system is now complete and ready for the next phase of development! 