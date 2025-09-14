# Ticket System Testing Guide

## Overview

This guide provides comprehensive testing strategies and identifies potential issues for the persistent ticket tracking system in the quiz application.

## Architecture Summary

The ticket system uses a hybrid approach:
- **MongoDB Persistent Storage**: `UsedTicket` model with TTL indexes for automatic cleanup
- **In-Memory Cache**: Fast lookup for frequently accessed tickets
- **Cron Job**: Hourly cleanup job as backup to TTL indexes

## Key Components

### 1. UsedTicket Model (`models/UsedTicket.js`)
- **Schema**: Stores ticket ID, expiration, quiz/user references, metadata
- **Indexes**: TTL index for auto-cleanup, compound indexes for queries
- **TTL Configuration**: `expireAfterSeconds: 0` means documents expire at `expiresAt` time

### 2. Ticket Manager (`utils/ticketManager.js`)
- `markTicketAsUsed()`: Creates persistent ticket record
- `isTicketUsed()`: Checks if ticket exists in database
- `cleanupExpiredTickets()`: Manual cleanup of expired tickets
- `getQuizTicketStats()`: Analytics and reporting

### 3. Cleanup Job (`jobs/ticketCleanup.js`)
- Runs every hour using node-cron
- Backup cleanup in case TTL index fails
- Logs cleanup statistics

### 4. Integration (`controllers/quizController.js`)
- **FIXED**: Now checks both in-memory and persistent storage
- Stores tickets in both systems for redundancy
- Handles race conditions and conflicts

## Testing Strategy

### 1. Unit Tests (`tests/ticket-tracking.test.js`)

**Schema and Model Tests:**
- ✅ Required fields validation
- ✅ Unique constraint on ticketId
- ✅ TTL index configuration
- ✅ Compound index creation

**Ticket Manager Tests:**
- ✅ Successful ticket creation
- ✅ Duplicate prevention
- ✅ Usage checking
- ✅ Cleanup functionality
- ✅ Statistics generation

**Error Handling:**
- ✅ Database connection failures
- ✅ Invalid ObjectIds
- ✅ Concurrent operations

**Performance Tests:**
- ✅ Bulk operations (1000+ tickets)
- ✅ Index usage verification
- ✅ Query performance

### 2. Integration Tests (`tests/ticket-integration.test.js`)

**End-to-End Flow:**
- ✅ Complete ticket lifecycle (launch → start → track)
- ✅ Ticket reuse prevention
- ✅ Cross-request persistence

**Error Scenarios:**
- ✅ Invalid ticket formats
- ✅ Expired tickets
- ✅ Wrong quiz tickets
- ✅ User mismatch

### 3. Running Tests

```bash
# Run all ticket tests
node test-ticket-system.js

# Run with coverage
node test-ticket-system.js --coverage

# Run only unit tests
node test-ticket-system.js --unit

# Run only integration tests
node test-ticket-system.js --integration

# Performance benchmark
node test-ticket-system.js --benchmark

# Verbose output
node test-ticket-system.js --verbose
```

### 4. Manual Testing Checklist

**Basic Functionality:**
- [ ] Launch quiz generates valid ticket
- [ ] Start quiz with valid ticket succeeds
- [ ] Reuse same ticket fails with 403
- [ ] Expired ticket fails with appropriate error
- [ ] Wrong quiz ticket fails

**Persistence Testing:**
- [ ] Server restart doesn't allow ticket reuse
- [ ] Database shows used tickets
- [ ] TTL cleanup removes expired tickets
- [ ] Cron job runs and logs cleanup

**Performance Testing:**
- [ ] 100+ concurrent ticket operations
- [ ] Large dataset cleanup performance
- [ ] Memory usage remains stable
- [ ] Index usage in queries

## Potential Issues and Risks

### 1. **CRITICAL: Integration Gap (FIXED)**
**Issue**: Persistent storage wasn't integrated with actual ticket validation
**Impact**: Tickets could be reused across server restarts
**Solution**: Modified `quizController.js` to check both systems
**Status**: ✅ RESOLVED

### 2. **TTL Index Reliability**
**Risk**: MongoDB TTL indexes run every 60 seconds, not immediately
**Impact**: Expired tickets might persist for up to 60 seconds
**Mitigation**: 
- Backup cron job for cleanup
- Application-level expiry checking
- Monitor TTL index performance

### 3. **Race Conditions**
**Risk**: Concurrent requests with same ticket
**Impact**: Potential duplicate ticket usage
**Mitigation**:
- Database unique constraint
- Atomic operations
- Proper error handling for duplicates

### 4. **MongoDB Connection Issues**
**Risk**: Database unavailable during ticket operations
**Impact**: Tickets might be stored in memory only
**Mitigation**:
- Graceful error handling
- Fallback to in-memory only mode
- Health checks and monitoring

### 5. **Memory Leak in In-Memory Cache**
**Risk**: `usedTicketIds` Map grows without bounds
**Impact**: Server memory exhaustion
**Mitigation**:
- Periodic cleanup of expired entries
- Monitor memory usage
- Consider LRU cache with size limits

### 6. **Clock Skew Issues**
**Risk**: Server time differences affect TTL
**Impact**: Tickets expire too early/late
**Mitigation**:
- NTP synchronization
- Clock skew tolerance settings
- Monitor server time drift

### 7. **Index Performance**
**Risk**: Large datasets slow down queries
**Impact**: Ticket checking becomes slow
**Mitigation**:
- Monitor index usage
- Regular index maintenance
- Partitioning for very large datasets

### 8. **Backup and Recovery**
**Risk**: Ticket data loss during database issues
**Impact**: Security breach through ticket reuse
**Mitigation**:
- Regular database backups
- Point-in-time recovery
- Disaster recovery procedures

## Monitoring and Alerting

### Key Metrics to Monitor:

1. **Ticket Creation Rate**
   - Normal: Matches quiz launch rate
   - Alert: Sudden spikes or drops

2. **Cleanup Job Performance**
   - Normal: Completes within 1 minute
   - Alert: Job fails or takes too long

3. **Database Performance**
   - Normal: Ticket queries < 10ms
   - Alert: Query time > 100ms

4. **Memory Usage**
   - Normal: Stable in-memory cache size
   - Alert: Continuous growth

5. **Error Rates**
   - Normal: < 1% ticket operation failures
   - Alert: > 5% failure rate

### Recommended Alerts:

```javascript
// Example monitoring setup
{
  "ticket_creation_failures": {
    "threshold": "5% in 5 minutes",
    "action": "page_on_call"
  },
  "cleanup_job_failure": {
    "threshold": "1 failure",
    "action": "alert_team"
  },
  "ticket_reuse_attempts": {
    "threshold": "> 10 in 1 hour",
    "action": "security_review"
  },
  "database_connection_loss": {
    "threshold": "1 occurrence",
    "action": "immediate_alert"
  }
}
```

## Production Deployment Checklist

### Pre-Deployment:
- [ ] All tests pass with 100% success rate
- [ ] Performance benchmarks meet requirements
- [ ] TTL indexes created and verified
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested

### Post-Deployment:
- [ ] Monitor ticket creation/usage patterns
- [ ] Verify TTL cleanup is working
- [ ] Check memory usage trends
- [ ] Validate security event logging
- [ ] Performance metrics within acceptable ranges

### Configuration Verification:
```bash
# Verify TTL index
db.usedtickets.getIndexes()

# Check cleanup job schedule
grep "0 \* \* \* \*" logs/

# Verify environment variables
echo $ENABLE_SINGLE_USE_TICKETS
echo $LAUNCH_TICKET_TTL_MIN
```

## Troubleshooting Common Issues

### Issue: Tickets Not Being Cleaned Up
**Symptoms**: Database size growing continuously
**Diagnosis**: 
```javascript
// Check TTL index
db.usedtickets.getIndexes()
// Check expired documents
db.usedtickets.find({expiresAt: {$lt: new Date()}}).count()
```
**Solutions**:
1. Verify TTL index exists and is correct
2. Check if cleanup job is running
3. Manual cleanup: `await ticketManager.cleanupExpiredTickets()`

### Issue: High Memory Usage
**Symptoms**: Server memory continuously increasing
**Diagnosis**: Check in-memory cache size
**Solutions**:
1. Reduce ticket TTL
2. Implement LRU cache
3. More frequent memory cleanup

### Issue: Ticket Reuse Not Prevented
**Symptoms**: Same ticket works multiple times
**Diagnosis**: 
```javascript
// Check if ticket exists in DB
await UsedTicket.findOne({ticketId: 'problematic_jti'})
```
**Solutions**:
1. Verify integration is working
2. Check unique constraint on ticketId
3. Review error handling in ticket creation

## Performance Benchmarks

### Expected Performance (on modern hardware):

- **Ticket Creation**: > 1000 tickets/second
- **Ticket Lookup**: > 2000 lookups/second  
- **Cleanup Operation**: < 1 second for 10,000 expired tickets
- **Memory Usage**: < 1MB for 10,000 active tickets
- **Database Size**: ~200 bytes per ticket record

### Load Testing Scenarios:

1. **Normal Load**: 100 concurrent users, 10 quizzes
2. **Peak Load**: 1000 concurrent users, 50 quizzes
3. **Stress Test**: 5000 concurrent users, 100 quizzes
4. **Endurance Test**: Normal load for 24 hours

## Security Considerations

### Threats Mitigated:
- ✅ Ticket replay attacks
- ✅ Cross-quiz ticket usage
- ✅ Expired ticket usage
- ✅ Concurrent ticket abuse

### Remaining Risks:
- ⚠️ Ticket prediction (mitigated by JWT signing)
- ⚠️ Time-based attacks (mitigated by clock skew tolerance)
- ⚠️ Database injection (mitigated by Mongoose)

### Security Best Practices:
1. Regular security audits
2. Monitor for unusual patterns
3. Keep JWT secrets secure
4. Regular dependency updates
5. Network-level protections

## Conclusion

The persistent ticket tracking system provides robust protection against ticket reuse while maintaining high performance. The comprehensive test suite covers all critical functionality and edge cases. With proper monitoring and the identified mitigations in place, the system is ready for production deployment.

Key success factors:
- ✅ Hybrid storage approach (fast + persistent)
- ✅ Comprehensive error handling
- ✅ Automatic cleanup mechanisms
- ✅ Performance optimization
- ✅ Security-first design
