# IP Filtering Configuration

## Environment Variables

### IP Filtering Control
- `ENFORCE_IP_FILTERING=true|false` (default: true)
  - Set to `false` to disable IP filtering globally
  - When disabled, all IP checks are bypassed

### Proxy Configuration
- `TRUST_PROXY=true|false` (default: false)
  - Set to `true` when running behind Nginx, Heroku, or other proxies
  - Enables `app.set('trust proxy', 1)` for proper IP detection
  - Uses `X-Forwarded-For` headers for client IP

## Example Configuration

### Development (Local)
```bash
ENFORCE_IP_FILTERING=true
TRUST_PROXY=false
```

### Production (Behind Nginx)
```bash
ENFORCE_IP_FILTERING=true
TRUST_PROXY=true
```

### Testing (Disable IP Filtering)
```bash
ENFORCE_IP_FILTERING=false
TRUST_PROXY=false
```

## Security Features

### IP Validation
- Supports IPv4 and IPv6 CIDR notation
- Handles localhost normalization (::1 → 127.0.0.1)
- Gracefully handles invalid CIDR formats
- Logs warnings for malformed inputs

### Enforcement Points
- **Launch endpoint**: Blocks IP-restricted quiz launches
- **Start endpoint**: Double-checks IP before quiz start
- **Security logging**: Records all IP blocking events

### Logging Events
- `IP_BLOCKED`: Launch attempt blocked by IP
- `IP_BLOCKED_START`: Start attempt blocked by IP
- Includes user ID, IP, quiz details, and configured CIDRs

## Backwards Compatibility

- Quizzes without `allowedIpCidrs` field work exactly as before
- Empty `allowedIpCidrs` array allows all IPs
- Existing time window and access code logic unchanged
- Gradual rollout: add IP restrictions to quizzes as needed
