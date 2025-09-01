# 🚀 Quiz App Command Reference Guide

## 📋 **Quick Start Commands**

### **Server Status Check:**
```powershell
# Quick check - is server running?
netstat -an | findstr :5000

# See all running Node.js processes
tasklist | findstr node

# See all processes using port 5000
netstat -an | findstr :5000
```

### **Server Restart (Complete):**
```powershell
# 1. Kill all processes
taskkill /F /IM node.exe

# 2. Verify port is free
netstat -an | findstr :5000

# 3. Start fresh
cd server; npx nodemon server.js
```

---

## 🛑 **Server Management Commands**

### **Stop Background Server:**
```powershell
# Kill all Node.js processes (MOST COMMON COMMAND)
taskkill /F /IM node.exe

# Kill specific process by PID
taskkill /F /PID <process_id>

# Kill by port (find PID first, then kill)
netstat -ano | findstr :5000
taskkill /F /PID <PID_from_above>
```

### **Start Server Manually:**
```powershell
# Start from project root
cd D:\Desktop\quiz-app
npx nodemon server.js

# Start from server directory
cd D:\Desktop\quiz-app\server
npx nodemon server.js

# Start with regular node (no auto-restart)
node server.js
```

---

## 🌐 **Network Testing Commands**

### **Local Access Testing:**
```powershell
# Test localhost access
Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing

# Test API endpoints
Invoke-WebRequest -Uri "http://localhost:5000/api/quizzes" -UseBasicParsing
```

### **Network Access Testing:**
```powershell
# Get your current IP address
ipconfig | findstr "IPv4"

# Test network access from other machines
Invoke-WebRequest -Uri "http://143.167.178.160:5000" -UseBasicParsing

# Test specific network IP (replace with your IP)
Invoke-WebRequest -Uri "http://YOUR_IP:5000" -UseBasicParsing
```

---

## 📁 **File Operations Commands**

### **Navigation:**
```powershell
# Navigate to project root
cd D:\Desktop\quiz-app

# Navigate to client directory
cd client

# Navigate to server directory
cd server

# Go back one level
cd ..

# Go back to project root from anywhere
cd D:\Desktop\quiz-app
```

### **React App Management:**
```powershell
# Build React app (after code changes)
cd client
npm run build

# Start React dev server (development only)
npm start

# Install dependencies (if needed)
npm install
```

---

## 🧪 **Testing & Debugging Commands**

### **Server Health Check:**
```powershell
# Check if server is responding
curl http://localhost:5000

# Check API health
curl http://localhost:5000/api/quizzes

# Check server logs (watch terminal where server is running)
# Just observe the nodemon output
```

### **Port Status Check:**
```powershell
# Check if port 5000 is in use
netstat -an | findstr :5000

# Check what's using port 5000 (Windows 10+)
netstat -ano | findstr :5000

# Check all active connections
netstat -an
```

---

## 🔄 **Common Scenarios & Solutions**

### **Scenario 1: "Port 5000 already in use"**
```powershell
# Solution: Kill all Node processes
taskkill /F /IM node.exe

# Verify port is free
netstat -an | findstr :5000

# Then restart
npx nodemon server.js
```

### **Scenario 2: "Server not responding"**
```powershell
# Check if it's running
netstat -an | findstr :5000

# If not running, start it
cd server; npx nodemon server.js

# If running but not responding, restart
taskkill /F /IM node.exe
cd server; npx nodemon server.js
```

### **Scenario 3: "Need to test network access"**
```powershell
# Get your IP
ipconfig | findstr "IPv4"

# Test access
Invoke-WebRequest -Uri "http://YOUR_IP:5000" -UseBasicParsing

# Test from another machine using your IP
# Open browser: http://YOUR_IP:5000
```

### **Scenario 4: "Frontend changes not showing"**
```powershell
# Rebuild React app
cd client
npm run build

# Restart server
cd ..
taskkill /F /IM node.exe
npx nodemon server.js
```

### **Scenario 5: "Syntax errors in server code"**
```powershell
# Stop server
taskkill /F /IM node.exe

# Fix code errors
# Then restart
npx nodemon server.js
```

---

## 🎯 **Most Frequently Used Commands (Top 10)**

1. **`taskkill /F /IM node.exe`** - Kill all Node processes
2. **`netstat -an | findstr :5000`** - Check port status
3. **`npx nodemon server.js`** - Start server with auto-restart
4. **`cd server; npx nodemon server.js`** - Start from root directory
5. **`Invoke-WebRequest -Uri "http://localhost:5000"`** - Test local access
6. **`ipconfig | findstr "IPv4"`** - Get current IP address
7. **`cd client; npm run build`** - Rebuild React app
8. **`Invoke-WebRequest -Uri "http://YOUR_IP:5000"`** - Test network access
9. **`cd ..`** - Navigate back one level
10. **`cd D:\Desktop\quiz-app`** - Return to project root

---

## 💡 **Pro Tips & Best Practices**

### **PowerShell Management:**
- Keep a PowerShell window open for server management
- Use `taskkill /F /IM node.exe` as your go-to command for stopping servers
- Always check port status before starting server
- Use `npx nodemon server.js` for development (auto-restart on changes)
- Use `node server.js` for production-like testing

### **Troubleshooting Workflow:**
1. **Check status** - `netstat -an | findstr :5000`
2. **Kill processes** - `taskkill /F /IM node.exe`
3. **Verify clean state** - `netstat -an | findstr :5000`
4. **Start fresh** - `npx nodemon server.js`
5. **Test access** - `Invoke-WebRequest -Uri "http://localhost:5000"`

### **Network Testing Workflow:**
1. **Get your IP** - `ipconfig | findstr "IPv4"`
2. **Test local** - `Invoke-WebRequest -Uri "http://localhost:5000"`
3. **Test network** - `Invoke-WebRequest -Uri "http://YOUR_IP:5000"`
4. **Test from other machine** - Open browser to `http://YOUR_IP:5000`

---

## 🚨 **Emergency Commands**

### **Complete System Reset:**
```powershell
# Nuclear option - kill everything and start fresh
taskkill /F /IM node.exe
taskkill /F /IM nodemon.exe
netstat -an | findstr :5000
cd D:\Desktop\quiz-app\server
npx nodemon server.js
```

### **Force Kill Everything:**
```powershell
# Kill all processes forcefully
taskkill /F /IM node.exe /T
taskkill /F /IM nodemon.exe /T

# Check what's left
tasklist | findstr node
```

---

## 📚 **Command Categories Summary**

| Category | Commands | Usage |
|----------|----------|-------|
| **Server Control** | `taskkill`, `npx nodemon`, `node` | Start/stop server |
| **Network Testing** | `Invoke-WebRequest`, `ipconfig` | Test connectivity |
| **Port Management** | `netstat` | Check port status |
| **File Navigation** | `cd` | Navigate directories |
| **React Management** | `npm run build` | Build frontend |
| **Process Control** | `tasklist`, `taskkill` | Manage processes |

---

## 🔧 **Environment-Specific Commands**

### **Windows PowerShell:**
```powershell
# Windows-specific commands (what we used)
taskkill /F /IM node.exe
netstat -an | findstr :5000
ipconfig | findstr "IPv4"
```

### **Linux/Mac (if you ever switch):**
```bash
# Equivalent Linux/Mac commands
pkill -f node
netstat -an | grep :5000
ifconfig | grep "inet "
```

---

## 📝 **Notes**

- **Port 5000** is the default server port
- **nodemon** automatically restarts server when files change
- **taskkill /F** forces process termination
- **netstat** shows network connections and ports
- **Invoke-WebRequest** is PowerShell's equivalent to curl
- Always check port status before starting server
- Keep this file handy for quick reference!

---

*Last Updated: Based on our chat session*
*Commands tested and verified working on Windows 10/11 with PowerShell*
