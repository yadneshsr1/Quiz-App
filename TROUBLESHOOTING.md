# Quiz App Troubleshooting Guide

## Quiz Visibility Issues

### Problem: "Quiz still appears after submission"

This issue occurs when a quiz remains visible in the "Available Quizzes" list even after a student has successfully submitted it.

### Diagnostic Tools

#### 1. Server Logs
The application uses structured JSON logging. Look for these log labels:

```bash
# Terminal 1: Start server and watch logs
npm run dev

# Terminal 2: Filter relevant logs
tail -f server.log | grep -E "(avail\.|submit\.)"
```

**Key Log Labels:**
- `avail.query.start` - Student requests available quizzes
- `avail.attempts` - Shows which quizzes student has already attempted
- `avail.result` - Final list of available quizzes returned
- `submit.in` - Quiz submission started
- `submit.out` - Quiz submission completed successfully
- `submit.duplicate` - Duplicate submission attempt detected

#### 2. Debug API Endpoint
Use the debug endpoint to see exactly why each quiz is included/excluded:

```bash
# Replace STUDENT_ID with actual student ObjectId
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  "http://localhost:5000/api/debug/availability?studentId=STUDENT_ID"
```

**Response shows per-quiz analysis:**
```json
{
  "quizId": "...",
  "title": "Quiz Title",
  "isAvailable": false,
  "reasons": {
    "assignmentOk": { "passed": true, "isPublic": true },
    "timeWindowOk": { "passed": true, "startOk": true, "endOk": true },
    "submissionOk": { "passed": false, "hasSubmission": true }
  }
}
```

#### 3. MongoDB Direct Queries

**Check if submission exists:**
```javascript
db.results.find({ 
  studentId: ObjectId("STUDENT_ID"), 
  quizId: ObjectId("QUIZ_ID") 
}).pretty()
```

**List all submitted quizzes for a student:**
```javascript
db.results.aggregate([
  { $match: { studentId: ObjectId("STUDENT_ID") } },
  { $group: { _id: "$quizId" } }
])
```

**Check for duplicate submissions:**
```javascript
db.results.aggregate([
  { $group: { _id: { studentId: "$studentId", quizId: "$quizId" }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

### Common Causes and Fixes

#### 1. Race Condition (Fixed)
**Symptom:** Multiple submissions created for same student+quiz
**Root Cause:** Non-atomic check-then-insert logic
**Fix:** Atomic upsert with `findOneAndUpdate`

#### 2. Frontend Cache Issues (Fixed)
**Symptom:** Dashboard shows stale data after submission
**Root Cause:** No cache invalidation after quiz submission
**Fix:** 
- Global cache invalidation function
- Forced refetch on dashboard return
- Proper loading states

#### 3. Missing Unique Index
**Symptom:** Duplicate Results in database
**Check:** 
```javascript
db.results.getIndexes()
// Should show: { "quizId": 1, "studentId": 1 }
```
**Fix:** Index is automatically created on server startup

#### 4. Browser Issues
**Symptom:** Inconsistent behavior across page refreshes
**Fix:** 
- Hard refresh: `Ctrl+Shift+R`
- Clear localStorage: `localStorage.clear()`
- Check Network tab for failed requests

### Testing the Fix

#### Automated Tests
```bash
cd server
npm test
```

**Key tests:**
- `Quiz disappears after submission`
- `Idempotent submission - duplicate POSTs create only one Result`
- `Race condition protection - concurrent submissions`

#### Manual Test Flow
1. **Login as student**
2. **Verify quiz appears** in Available Quizzes
3. **Submit quiz** and wait for success message
4. **Navigate back** to dashboard
5. **Verify quiz disappeared** from Available Quizzes
6. **Check analytics** (as academic) shows the submission

#### Debug Commands
```bash
# Watch server logs during test
tail -f server.log | jq 'select(.label | startswith("avail") or startswith("submit"))'

# Check final state
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/debug/availability?studentId=$STUDENT_ID" | jq '.quizzes[] | select(.title | contains("Test Quiz"))'
```

### Performance Considerations

#### Database Indexes
Ensure these indexes exist:
```javascript
// Results collection
{ "quizId": 1, "studentId": 1 } // unique: true

// Quizzes collection  
{ "startTime": 1, "endTime": 1 }
{ "assignedStudentIds": 1 }
```

#### Frontend Optimization
- Debounced refetch (max 1 request per second)
- Loading states prevent duplicate submissions
- Cache invalidation only when necessary

### Monitoring in Production

#### Key Metrics
- Submission success rate
- Duplicate submission attempts
- Cache hit/miss ratio
- Average response time for `/api/quizzes/eligible`

#### Alerts
Set up alerts for:
- High duplicate submission rate (>1% of submissions)
- Slow availability queries (>500ms)
- Failed submissions (HTTP 500 responses)

#### Log Analysis
```bash
# Count submissions by hour
grep "submit.out" server.log | jq -r '.ts[0:13]' | sort | uniq -c

# Find users with multiple submissions for same quiz
grep "submit.duplicate" server.log | jq -r '.studentId + " " + .quizId' | sort | uniq -c
```

### Recovery Procedures

#### Remove Duplicate Submissions
```javascript
// Find duplicates and keep the latest
db.results.aggregate([
  { $sort: { submittedAt: -1 } },
  { $group: { 
    _id: { studentId: "$studentId", quizId: "$quizId" },
    docs: { $push: "$$ROOT" }
  }},
  { $match: { "docs.1": { $exists: true } } }
]).forEach(function(group) {
  // Keep first (latest), remove others
  group.docs.slice(1).forEach(function(doc) {
    db.results.deleteOne({ _id: doc._id });
  });
});
```

#### Rebuild Indexes
```javascript
db.results.dropIndexes();
db.results.createIndex({ "quizId": 1, "studentId": 1 }, { unique: true });
```

#### Clear Frontend Cache
```javascript
// Run in browser console
localStorage.clear();
if (window.quizCacheInvalidate) {
  window.quizCacheInvalidate();
}
location.reload();
```
