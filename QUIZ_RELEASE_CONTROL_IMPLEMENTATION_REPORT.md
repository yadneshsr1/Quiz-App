# Quiz Release Control Implementation - Complete Process Report

## Implementation Process Step by Step (Steps 1-7)

### STEP 1 — Extend Quiz Model & Add "Eligible" Endpoint (Backend)

**Files Modified:**
- `server/models/Quiz.js`
- `server/controllers/quizController.js`
- `server/routes/quizRoutes.js`

**Changes Made:**
1. **Extended Quiz Schema:**
   ```javascript
   // Added to quizSchema:
   endTime: Date, // New field for quiz availability end time
   accessCodeHash: String, // New field for hashed access code (optional)
   ```

2. **Created `/api/quizzes/eligible` endpoint:**
   ```javascript
   // New route in quizRoutes.js
   router.get("/eligible", auth, quizController.getEligibleQuizzes);
   
   // New controller function
   exports.getEligibleQuizzes = function (req, res, next) {
     const now = new Date();
     const query = {
       $and: [
         { startTime: { $lte: now } }, // Quiz has started
         {
           $or: [
             { endTime: null }, // No end time set (always available)
             { endTime: { $gte: now } } // End time is in the future
           ]
         }
       ]
     };
     
     Quiz.find(query)
       .select('-accessCodeHash') // Exclude sensitive data
       .sort({ startTime: -1 })
       .then((quizzes) => res.json(quizzes));
   };
   ```

**Testing:**
```bash
# Create test quizzes via API
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Open Quiz","startTime":"2024-01-01T00:00:00.000Z"}'

curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Future Quiz","startTime":"2025-12-31T00:00:00.000Z"}'

# Test eligible endpoint
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/quizzes/eligible
# Expected: Only "Open Quiz" returned
```

---

### STEP 2 — Academic UI: Add EndTime and Optional AccessCode Fields (Frontend)

**Files Modified:**
- `client/src/pages/AcademicDashboard.js`

**Changes Made:**
1. **Extended form state:**
   ```javascript
   const [formData, setFormData] = useState({
     title: "",
     description: "",
     moduleCode: "",
     startTime: "",
     endTime: "", // Added
     accessCode: "", // Added
   });
   ```

2. **Added form inputs:**
   ```javascript
   <div style={{ marginBottom: "20px" }}>
     <label>End Time (Optional):</label>
     <input
       type="datetime-local"
       name="endTime"
       value={formData.endTime}
       onChange={handleChange}
     />
   </div>
   <div style={{ marginBottom: "20px" }}>
     <label>Access Code (Optional):</label>
     <input
       type="text"
       name="accessCode"
       value={formData.accessCode}
       onChange={handleChange}
       placeholder="Leave blank for no access code"
     />
   </div>
   ```

**Testing:**
1. Login as academic user
2. Create quiz with end time and access code
3. Verify quiz appears in academic dashboard
4. Verify `/api/quizzes/eligible` still works correctly

---

### STEP 3 — Server: Hash Access Code on Create/Update + Enforce Time Window

**Files Modified:**
- `server/controllers/quizController.js`

**Changes Made:**
1. **Added bcrypt import and access code hashing:**
   ```javascript
   const bcrypt = require("bcryptjs");
   
   // In createQuiz function:
   if (quizData.accessCode && quizData.accessCode.trim() !== "") {
     const saltRounds = 10;
     quizData.accessCodeHash = await bcrypt.hash(quizData.accessCode, saltRounds);
     delete quizData.accessCode; // Remove plaintext
   }
   ```

2. **Added time window enforcement:**
   ```javascript
   // Utility function
   function isQuizOpen(quiz, now = new Date()) {
     if (quiz.startTime && new Date(quiz.startTime) > now) {
       return false;
     }
     if (quiz.endTime && new Date(quiz.endTime) <= now) {
       return false;
     }
     return true;
   }
   ```

**Testing:**
```bash
# Create quiz with access code
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Protected Quiz","startTime":"2024-01-01T00:00:00.000Z","accessCode":"secret123"}'

# Verify accessCodeHash is stored (not plaintext)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/quizzes
# Expected: accessCodeHash field present, no accessCode field
```

---

### STEP 4 — Launch Flow: `/api/quizzes/:id/launch` (Access Code → Short-lived Launch Ticket)

**Files Modified:**
- `server/controllers/quizController.js`
- `server/routes/quizRoutes.js`
- `server/server.js`

**Changes Made:**
1. **Added launch endpoint:**
   ```javascript
   // In quizRoutes.js
   router.post("/:quizId/launch", auth, quizController.launchQuiz);
   
   // In quizController.js
   exports.launchQuiz = async function (req, res, next) {
     const { quizId } = req.params;
     const { accessCode } = req.body;
     const userId = req.user.id;
   
     // Find quiz and verify it's open
     const quiz = await Quiz.findById(quizId);
     if (!isQuizOpen(quiz)) {
       return res.status(403).json({ error: "Quiz not open" });
     }
   
     // Verify access code if required
     if (quiz.accessCodeHash) {
       if (!accessCode) {
         return res.status(403).json({ error: "Access code required" });
       }
       const isValidCode = await bcrypt.compare(accessCode, quiz.accessCodeHash);
       if (!isValidCode) {
         return res.status(403).json({ error: "Invalid access code" });
       }
     }
   
     // Generate launch ticket JWT
     const ticket = signLaunchTicket(userId, quizId);
     res.json({ ticket });
   };
   ```

2. **Added JWT signing function:**
   ```javascript
   function signLaunchTicket(userId, quizId) {
     const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || "quiz-launch-secret-dev-only";
     const payload = {
       sub: userId,
       quizId: quizId,
       jti: `launch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
       iat: Math.floor(Date.now() / 1000),
       exp: Math.floor(Date.now() / 1000) + (10 * 60), // 10 minutes TTL
       typ: "launch"
     };
     return jwt.sign(payload, QUIZ_TOKEN_SECRET);
   }
   ```

3. **Added rate limiting:**
   ```javascript
   // In server.js
   const rateLimit = require("express-rate-limit");
   const launchLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 10, // limit each IP to 10 requests per windowMs
     message: { error: "Too many launch attempts, please try again later" }
   });
   app.use("/api/quizzes/:quizId/launch", launchLimiter);
   ```

**Testing:**
```bash
# Test launch with correct access code
curl -X POST http://localhost:5000/api/quizzes/<quizId>/launch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"accessCode":"secret123"}'
# Expected: { "ticket": "eyJ..." }

# Test launch with wrong access code
curl -X POST http://localhost:5000/api/quizzes/<quizId>/launch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"accessCode":"wrongcode"}'
# Expected: { "error": "Invalid access code" }
```

---

### STEP 5 — Gate the Actual Quiz Start with the Launch Ticket

**Files Modified:**
- `server/middleware/requireLaunchTicket.js` (new file)
- `server/controllers/quizController.js`
- `server/routes/quizRoutes.js`

**Changes Made:**
1. **Created launch ticket middleware:**
   ```javascript
   // requireLaunchTicket.js
   const jwt = require("jsonwebtoken");
   
   const requireLaunchTicket = (req, res, next) => {
     const launchTicket = req.headers['x-quiz-launch'] || req.body.launchTicket;
   
     if (!launchTicket) {
       return res.status(401).json({ error: "Launch ticket required" });
     }
   
     try {
       const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || "quiz-launch-secret-dev-only";
       const decoded = jwt.verify(launchTicket, QUIZ_TOKEN_SECRET);
   
       // Verify ticket type, expiration, quizId match, user match
       if (decoded.typ !== "launch") {
         return res.status(403).json({ error: "Invalid ticket type" });
       }
       // ... other validations
   
       req.launchTicket = decoded;
       next();
     } catch (error) {
       return res.status(403).json({ error: "Launch ticket verification failed" });
     }
   };
   ```

2. **Added start endpoint:**
   ```javascript
   // In quizRoutes.js
   router.get("/:quizId/start", auth, requireLaunchTicket, quizController.startQuiz);
   
   // In quizController.js
   exports.startQuiz = async function (req, res, next) {
     const { quizId } = req.params;
     const userId = req.user.id;
   
     // Double-check quiz is open
     const quiz = await Quiz.findById(quizId);
     if (!isQuizOpen(quiz)) {
       return res.status(403).json({ error: "Quiz not open" });
     }
   
     // Get questions (without correct answers for security)
     const questions = await Question.find({ quizId: quizId, deletedAt: null });
   
     const quizPayload = {
       _id: quiz._id,
       title: quiz.title,
       description: quiz.description,
       moduleCode: quiz.moduleCode,
       startTime: quiz.startTime,
       endTime: quiz.endTime,
       totalQuestions: questions.length,
       questions: questions.map(q => ({
         _id: q._id,
         questionText: q.title || q.stem,
         options: q.options,
         // Don't include correctAnswerIndex or feedback for security
       }))
     };
   
     res.json(quizPayload);
   };
   ```

**Testing:**
```bash
# Step 1: Get launch ticket
curl -X POST http://localhost:5000/api/quizzes/<quizId>/launch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"accessCode":"secret123"}'

# Step 2: Use ticket to start quiz
curl -H "Authorization: Bearer <token>" \
  -H "X-Quiz-Launch: <ticket>" \
  http://localhost:5000/api/quizzes/<quizId>/start
# Expected: Quiz payload with questions (no correct answers)
```

---

### STEP 6 — Student UI: Use /eligible, Prompt for Access Code, Then Call /launch, Then /start

**Files Modified:**
- `client/src/pages/StudentDashboard.js`

**Changes Made:**
1. **Updated quiz fetching:**
   ```javascript
   const fetchQuizzes = async () => {
     const response = await fetch("http://localhost:5000/api/quizzes/eligible", {
       headers: { "Authorization": `Bearer ${token}` }
     });
     const quizzes = await response.json();
     setAvailableQuizzes(quizzes);
   };
   ```

2. **Added access code modal:**
   ```javascript
   const [accessCodeModal, setAccessCodeModal] = useState({ isOpen: false, quiz: null });
   const [accessCode, setAccessCode] = useState("");
   const [isLaunching, setIsLaunching] = useState(false);
   
   const handleStartQuiz = async (quiz) => {
     setAccessCodeModal({ isOpen: true, quiz });
   };
   
   const handleLaunchQuiz = async () => {
     setIsLaunching(true);
     try {
       // Step 1: Launch quiz with access code
       const launchResponse = await fetch(`/api/quizzes/${accessCodeModal.quiz._id}/launch`, {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
         body: JSON.stringify({ accessCode: accessCode.trim() })
       });
       const { ticket } = await launchResponse.json();
   
       // Step 2: Start quiz with launch ticket
       const startResponse = await fetch(`/api/quizzes/${accessCodeModal.quiz._id}/start`, {
         headers: { "Authorization": `Bearer ${token}`, "X-Quiz-Launch": ticket }
       });
   
       // Success! Navigate to quiz taking page
       navigate(`/quiz/${accessCodeModal.quiz._id}`);
     } catch (error) {
       alert(`Error: ${error.message}`);
     } finally {
       setIsLaunching(false);
     }
   };
   ```

3. **Added modal JSX:**
   ```javascript
   {accessCodeModal.isOpen && (
     <div style={{ /* modal styles */ }}>
       <h2>Enter Access Code for "{accessCodeModal.quiz?.title}"</h2>
       <input
         type="text"
         placeholder="Access Code"
         value={accessCode}
         onChange={(e) => setAccessCode(e.target.value)}
       />
       <button onClick={handleLaunchQuiz} disabled={isLaunching}>
         {isLaunching ? "Launching..." : "Launch Quiz"}
       </button>
       <button onClick={() => setAccessCodeModal({ isOpen: false, quiz: null })}>
         Cancel
       </button>
     </div>
   )}
   ```

**Testing:**
1. Login as student
2. View eligible quizzes (only open ones)
3. Click "Start Quiz" on protected quiz
4. Enter access code in modal
5. Verify navigation to quiz taking page

---

### STEP 7 — Polishing & Edge Cases

**Files Modified:**
- `server/controllers/quizController.js`
- `server/middleware/requireLaunchTicket.js`
- `server/models/Quiz.js`
- `client/src/pages/StudentDashboard.js`

**Changes Made:**
1. **Clock skew tolerance:**
   ```javascript
   const CLOCK_SKEW_TOLERANCE_MS = parseInt(process.env.CLOCK_SKEW_TOLERANCE_MS) || 60000;
   
   function isQuizOpen(quiz, now = new Date()) {
     const toleranceMs = CLOCK_SKEW_TOLERANCE_MS;
     // Apply tolerance to start/end time checks
   }
   ```

2. **Configurable TTL:**
   ```javascript
   const LAUNCH_TICKET_TTL_MIN = parseInt(process.env.LAUNCH_TICKET_TTL_MIN) || 10;
   ```

3. **Security logging:**
   ```javascript
   function logSecurityEvent(event, details) {
     const timestamp = new Date().toISOString();
     console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
   }
   ```

4. **Single-use tickets (optional):**
   ```javascript
   const ENABLE_SINGLE_USE_TICKETS = process.env.ENABLE_SINGLE_USE_TICKETS === 'true';
   const usedTicketIds = new Map();
   ```

5. **Student assignment filtering:**
   ```javascript
   // Added to Quiz model:
   assignedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
   ```

6. **Better error messages:**
   ```javascript
   // All error responses now include user-friendly messages
   return res.status(403).json({ 
     error: "Invalid access code",
     message: "The access code you entered is incorrect. Please check with your instructor and try again."
   });
   ```

**Testing:**
```bash
# Test clock skew tolerance
# Test configurable TTL
# Test security logging
# Test single-use tickets
# Test student assignment filtering
# Test improved error messages
```

---

## Complete Quiz App Workflow

### 1. **Quiz Creation (Academic User)**

**Step 1: Academic Login**
- User navigates to `/login`
- Enters academic credentials (username: "academic1", password: "password123")
- System validates credentials and stores JWT token in localStorage
- Redirected to `/academic` dashboard

**Step 2: Create Quiz**
- Academic clicks "Create New Quiz" button
- Modal opens with form fields:
  - Title: "Midterm Exam"
  - Description: "Covers chapters 1-5"
  - Module Code: "CS101"
  - Start Time: "2024-01-15T09:00:00" (datetime-local)
  - End Time: "2024-01-15T11:00:00" (datetime-local) - **NEW**
  - Access Code: "midterm2024" (optional) - **NEW**
- Academic clicks "Create Quiz"
- System sends `POST /api/quizzes` with form data
- Server hashes access code with bcrypt (salt rounds: 10)
- Server stores quiz with `accessCodeHash` (not plaintext)
- Quiz appears in academic's dashboard

**Step 3: Add Questions**
- Academic clicks "Add Question" on the quiz
- Modal opens for question creation:
  - Question Text: "What is the primary purpose of an algorithm?"
  - Options: ["To solve problems efficiently", "To make code readable", ...]
  - Correct Answer: Option 0
  - Feedback: "Algorithms are step-by-step procedures..."
- System sends `POST /api/quizzes/:id/questions`
- Question is stored in separate Question model
- Question appears in quiz's question list

### 2. **Quiz Availability (Time Windows)**

**Server-side Enforcement:**
- `isQuizOpen()` function checks current server time against quiz's `startTime` and `endTime`
- Clock skew tolerance (±60 seconds) accounts for minor time differences
- Quiz is only accessible if: `startTime <= now <= endTime`

**Student View:**
- Students only see quizzes via `/api/quizzes/eligible` endpoint
- This endpoint filters quizzes by time windows automatically
- Students never see closed or future quizzes

### 3. **Quiz Launch (Student User)**

**Step 1: Student Login**
- Student navigates to `/login`
- Enters student credentials (username: "student1", password: "password123")
- System validates and stores JWT token
- Redirected to `/student` dashboard

**Step 2: View Available Quizzes**
- Student dashboard calls `GET /api/quizzes/eligible`
- Server filters quizzes by:
  - Time windows (currently open)
  - Student assignments (if configured)
  - Excludes `accessCodeHash` for security
- Only open quizzes are displayed

**Step 3: Launch Quiz**
- Student clicks "Start Quiz" on "Midterm Exam"
- If quiz has access code, modal appears: "Enter Access Code for 'Midterm Exam'"
- Student enters: "midterm2024"
- System sends `POST /api/quizzes/:id/launch` with access code
- Server validates:
  - Quiz exists and is open (time window check)
  - Access code matches (bcrypt.compare)
  - Rate limiting allows request
- If valid, server generates launch ticket JWT:
  ```javascript
  {
    sub: "student1_user_id",
    quizId: "quiz_id",
    jti: "launch_1234567890_abc123",
    iat: 1234567890,
    exp: 1234568490, // 10 minutes from now
    typ: "launch"
  }
  ```
- Server returns: `{ "ticket": "eyJ...", "message": "Quiz launched successfully..." }`

**Step 4: Start Quiz**
- System immediately calls `GET /api/quizzes/:id/start` with launch ticket
- Request includes header: `X-Quiz-Launch: <ticket>`
- `requireLaunchTicket` middleware validates:
  - JWT signature is valid
  - Ticket type is "launch"
  - Ticket is not expired (with clock skew tolerance)
  - Quiz ID matches request
  - User ID matches authenticated user
  - (Optional) Ticket hasn't been used before (single-use mode)
- If valid, server returns quiz payload:
  ```javascript
  {
    _id: "quiz_id",
    title: "Midterm Exam",
    description: "Covers chapters 1-5",
    moduleCode: "CS101",
    startTime: "2024-01-15T09:00:00.000Z",
    endTime: "2024-01-15T11:00:00.000Z",
    totalQuestions: 5,
    questions: [
      {
        _id: "question_id",
        questionText: "What is the primary purpose of an algorithm?",
        options: ["To solve problems efficiently", "To make code readable", ...]
        // NO correctAnswerIndex or feedback (security)
      }
    ]
  }
  ```
- Student is navigated to `/quiz/:quizId` (QuizTaking page)

### 4. **Quiz Taking**

**Quiz Interface:**
- Student sees quiz title, description, and questions
- Each question shows options as radio buttons
- Student selects answers and can navigate between questions
- Timer shows remaining time (if configured)
- Submit button appears when all questions answered

**Security During Quiz:**
- No correct answers or feedback visible to student
- Launch ticket ensures only authorized access
- Server continues to enforce time windows
- (Optional) Single-use tickets prevent multiple attempts

### 5. **Quiz Submission**

**Step 1: Submit Answers**
- Student clicks "Submit Quiz"
- System sends answers to submission endpoint
- Answers are stored with timestamp and user info

**Step 2: Results Processing**
- Server calculates score by comparing answers to correct answers
- Results are stored in database
- Student is redirected to results page

### 6. **Results and Analytics**

**Student Results:**
- Student sees score, correct/incorrect answers
- Feedback is now visible for each question
- Option to review answers

**Academic Analytics:**
- Academic can view quiz analytics
- See class performance, question statistics
- Identify difficult questions or concepts

### 7. **Security Events Logging**

**Throughout the Process:**
- All security events are logged with timestamps:
  - `QUIZ_LAUNCH_SUCCESS`: Successful quiz launch
  - `ACCESS_CODE_FAILED`: Wrong access code attempts
  - `TICKET_REUSE_ATTEMPT`: Attempted ticket reuse
  - `QUIZ_START_SUCCESS`: Successful quiz start
  - `QUIZ_LAUNCH_ATTEMPT`: Failed launch attempts

**Example Log Entry:**
```
[SECURITY] 2024-01-15T09:30:15.123Z - QUIZ_LAUNCH_SUCCESS: {
  userId: "student1_id",
  userIp: "192.168.1.100",
  quizId: "quiz_id",
  quizTitle: "Midterm Exam",
  hasAccessCode: true
}
```

### 8. **Configuration and Environment**

**Environment Variables:**
```bash
# Clock skew tolerance (default: 60 seconds)
CLOCK_SKEW_TOLERANCE_MS=60000

# Launch ticket TTL (default: 10 minutes)
LAUNCH_TICKET_TTL_MIN=10

# Enable single-use tickets (default: false)
ENABLE_SINGLE_USE_TICKETS=true

# Quiz token secret (production: use strong secret)
QUIZ_TOKEN_SECRET=your-production-secret-here

# IP filtering configuration
ENFORCE_IP_FILTERING=true
TRUST_PROXY=false
```

### 9. **Error Handling and User Experience**

**Graceful Error Handling:**
- All errors include user-friendly messages
- Students see helpful guidance for common issues
- System gracefully handles network issues
- Fallback data provided when database unavailable

**Security Features:**
- Access codes never stored in plaintext
- Launch tickets have short TTL (10 minutes)
- Rate limiting prevents brute force attacks
- Clock skew tolerance handles time synchronization issues
- Optional single-use tickets prevent ticket reuse

## Summary

This complete workflow ensures a secure, user-friendly quiz system with proper access control, time management, IP filtering, and comprehensive logging for academic integrity. The implementation follows security best practices while maintaining a smooth user experience for both academics and students.

## IP Filtering Implementation Details

### Features Added
- **IP Range Input**: Academic users can specify allowed IP ranges using CIDR notation
- **Backend Validation**: Server validates client IPs against configured ranges
- **Dual Enforcement**: IP checks at both launch and start endpoints
- **Security Logging**: All IP blocking events logged with full context
- **Environment Control**: Configurable via environment variables

### Technical Implementation
- **Schema Extension**: Added `allowedIpCidrs: [String]` to Quiz model
- **Utility Functions**: Custom IP validation with CIDR support
- **Middleware Integration**: IP checks integrated into existing launch flow
- **Error Handling**: User-friendly error messages for blocked access
- **Backwards Compatibility**: Existing quizzes work without modification

### Security Considerations
- **IP Normalization**: Handles IPv4/IPv6 and localhost variations
- **Graceful Degradation**: Invalid CIDRs logged but don't break functionality
- **Proxy Support**: Configurable trust proxy for deployment scenarios
- **Audit Trail**: Complete logging of all IP-related security events

## Key Security Features Implemented

1. **Time Window Control**: Server-enforced quiz availability based on start/end times
2. **Access Code Protection**: Optional access codes hashed with bcrypt
3. **Launch Ticket System**: Short-lived JWTs for quiz access control
4. **Rate Limiting**: Prevents brute force attacks on launch endpoint
5. **Clock Skew Tolerance**: Handles minor time synchronization issues
6. **Security Logging**: Comprehensive audit trail of all security events
7. **Single-use Tickets**: Optional feature to prevent ticket reuse
8. **Student Assignment**: Optional filtering by assigned students
9. **IP Address Filtering**: Restricts quiz access to specific networks/subnets using CIDR notation

## Files Modified Throughout Implementation

### Backend Files:
- `server/models/Quiz.js` - Extended schema
- `server/controllers/quizController.js` - Core business logic
- `server/routes/quizRoutes.js` - API endpoints
- `server/middleware/requireLaunchTicket.js` - New middleware
- `server/server.js` - Rate limiting configuration

### Frontend Files:
- `client/src/pages/AcademicDashboard.js` - Quiz creation form
- `client/src/pages/StudentDashboard.js` - Quiz access and launch

### Configuration:
- Environment variables for customization
- Optional features for enhanced security
- Development and production configurations

This implementation provides a robust, secure, and scalable quiz system suitable for academic environments.
