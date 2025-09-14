# Quiz API Documentation

## Authentication and Authorization

### Launch Ticket System

The quiz application implements a secure, persistent launch ticket system to prevent unauthorized quiz access and ensure single-use ticket validation.

#### Launch Ticket Flow

1. **Generate Launch Ticket** (POST `/api/quizzes/:id/launch`)

   - Validates access code and IP restrictions
   - Returns a signed JWT launch ticket
   - Response Time: ~100-200ms

2. **Use Launch Ticket** (GET `/api/quizzes/:id/start`)
   - Requires valid launch ticket in `x-quiz-launch` header
   - Performs async validation against database
   - Ensures single-use enforcement through MongoDB
   - Response Time: ~200-300ms

#### Implementation Notes

- Launch tickets are validated asynchronously
- Each ticket can only be used once (enforced through database constraints)
- Expired tickets are automatically cleaned up through MongoDB TTL index
- Additional cleanup job runs hourly as a backup mechanism

#### Error Scenarios

- `401 Unauthorized`: Missing launch ticket
- `403 Forbidden`: Invalid, expired, or already used ticket
- `403 Forbidden`: IP restriction or time window violation

#### Security Measures

- Persistent ticket tracking survives server restarts
- Race condition protection through MongoDB unique indexes
- Automatic cleanup of expired tickets
- Comprehensive audit logging of ticket usage

For detailed implementation examples, see the [Security Implementation Guide](./security-implementation.md).
