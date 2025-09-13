# Email Verification System Documentation

## Overview

The Shibr platform implements a comprehensive email verification system using OTP (One-Time Password) codes sent via email. This ensures that users have access to the email addresses they register with.

## System Architecture

### Components

1. **Backend (Convex)**
   - `convex/emailVerification.ts` - Core verification logic
   - `convex/schema.ts` - Database schema for OTP storage
   - `convex/users.ts` - User profile creation with verification trigger

2. **Frontend**
   - `app/verify-email/page.tsx` - Verification UI
   - `app/signin/page.tsx` - Sign-in flow integration
   - `lib/auth/server.ts` - Server-side verification checks

3. **Middleware**
   - `middleware.ts` - Route protection and public route configuration

## Configuration

### Environment Variables

```bash
# .env.local

# Skip email verification (development only)
SKIP_EMAIL_VERIFICATION=true  # Set to skip verification in development

# Resend API Key for sending emails
RESEND_API_KEY=re_YOUR_API_KEY_HERE  # Required for production email sending
```

### Development Mode

In development without `RESEND_API_KEY`:
- OTP codes are displayed in the console
- Emails are not actually sent
- Look for the OTP in terminal output with format:
  ```
  ==================================================
  📧 EMAIL VERIFICATION OTP
  ==================================================
  To: user@example.com
  OTP Code: 123456
  Valid for: 10 minutes
  ==================================================
  ```

### Production Mode

For production deployment:
1. Set `RESEND_API_KEY` in Convex environment variables
2. Remove or set `SKIP_EMAIL_VERIFICATION=false`
3. Ensure proper email templates are configured

## User Flow

### 1. Registration
- User signs up with email and password
- Profile is created (store/brand owner)
- OTP is generated and sent via email
- User is redirected to `/verify-email`

### 2. Verification Page
- User enters 6-digit OTP code
- System validates:
  - Code correctness
  - Expiry time (10 minutes)
  - Attempt limits (5 attempts)
- On success: Redirected to appropriate dashboard
- On failure: Error message with retry option

### 3. Sign-in Flow
- User signs in with credentials
- System checks verification status
- If unverified: Redirected to `/verify-email`
- If verified: Redirected to dashboard

### 4. Dashboard Access
- All dashboards check verification status
- Unverified users are redirected to `/verify-email`
- Server-side protection via `requireRole()` function

## Security Features

### Rate Limiting
- **OTP Requests**: Maximum 5 per hour per user
- **Verification Attempts**: Maximum 5 per OTP
- **Resend Cooldown**: 60 seconds between resend requests

### OTP Security
- 6-digit random code
- 10-minute expiry time
- Single-use (deleted after verification)
- Old OTPs cleaned up on new request

### Data Protection
- OTPs stored hashed in database
- Expired OTPs automatically cleaned
- Verification status cached for performance

## API Reference

### Mutations

#### `sendVerificationOTP`
```typescript
args: {
  userId: Id<"users">,
  email: string,
  userName?: string
}
returns: {
  success: boolean,
  error?: string,
  message?: string
}
```

#### `verifyOTP`
```typescript
args: {
  userId: Id<"users">,
  otp: string
}
returns: {
  success: boolean,
  error?: string,
  message?: string
}
```

#### `resendOTP`
```typescript
args: {
  userId: Id<"users">
}
returns: {
  success: boolean,
  error?: string,
  message?: string
}
```

### Queries

#### `checkVerificationStatus`
```typescript
args: {
  userId: Id<"users">
}
returns: {
  verified: boolean,
  verifiedAt?: number,
  hasPendingOTP?: boolean,
  otpExpiresAt?: number,
  error?: string
}
```

#### `isCurrentUserVerified`
```typescript
args: {}
returns: {
  verified: boolean,
  needsVerification: boolean,
  userId?: Id<"users">,
  skipped?: boolean
}
```

## Debugging

### Enable Debug Logs

The system includes comprehensive logging with prefixes:
- 📧 Email operations
- 🔐 Verification process
- ✅ Success states
- ❌ Error states
- 🔄 Resend operations
- 📊 Status checks

### Debug Mode

On the verify-email page in development:
1. Look for "Debug Info" at the bottom
2. Click to expand and see current state
3. Check console for detailed logs

### Common Issues

#### "No verification code found"
- OTP expired (>10 minutes)
- User requested new OTP
- Database query issue

#### "Too many verification attempts"
- User exceeded 5 attempts
- Solution: Request new OTP

#### "Email is already verified"
- User trying to resend for verified email
- Solution: Redirect to dashboard

#### Redirect Loop
- Cache mismatch between server/client
- Solution: Use `window.location.href` for hard redirect

## Testing

### Manual Testing

1. **Test OTP Flow**
   ```bash
   # Disable email skip
   # Comment out: SKIP_EMAIL_VERIFICATION=true

   # Register new user
   # Check console for OTP
   # Enter OTP on verification page
   ```

2. **Test Rate Limiting**
   - Try requesting >5 OTPs in an hour
   - Try wrong OTP >5 times
   - Try resending within 60 seconds

3. **Test Expiry**
   - Wait >10 minutes before entering OTP
   - Verify expiry error message

### Automated Testing

```typescript
// Example test cases
describe('Email Verification', () => {
  test('generates 6-digit OTP', () => {
    const otp = generateOTP()
    expect(otp).toMatch(/^\d{6}$/)
  })

  test('validates OTP correctly', async () => {
    const result = await verifyOTP({ userId, otp: '123456' })
    expect(result.success).toBe(true)
  })

  test('enforces rate limits', async () => {
    // Request 6 OTPs
    for (let i = 0; i < 6; i++) {
      const result = await sendVerificationOTP({ userId, email })
      if (i < 5) {
        expect(result.success).toBe(true)
      } else {
        expect(result.error).toContain('Too many')
      }
    }
  })
})
```

## Monitoring

### Key Metrics to Track

1. **Verification Success Rate**
   - Successful verifications / Total attempts
   - Target: >90%

2. **Average Time to Verify**
   - Time from OTP sent to verified
   - Target: <2 minutes

3. **Email Delivery Rate**
   - Emails sent / Emails delivered
   - Target: >95%

4. **Error Rates**
   - Expired OTPs
   - Max attempts exceeded
   - Rate limit hits

### Logging Queries

```typescript
// Get verification history for user
const history = await getVerificationHistory({ userId })

// Check current system status
const stats = {
  pendingOTPs: await ctx.db.query("emailVerificationOTP")
    .filter(q => q.eq(q.field("verified"), false))
    .collect(),
  verifiedToday: await ctx.db.query("emailVerificationOTP")
    .filter(q => q.and(
      q.eq(q.field("verified"), true),
      q.gt(q.field("verifiedAt"), Date.now() - 86400000)
    ))
    .collect()
}
```

## Troubleshooting Guide

### For Developers

1. **Check Environment Variables**
   ```bash
   echo $SKIP_EMAIL_VERIFICATION
   echo $RESEND_API_KEY
   ```

2. **Check Convex Logs**
   ```bash
   bunx convex logs
   ```

3. **Check Browser Console**
   - Look for `[verify-email]` prefixed logs
   - Check network tab for API calls

### For Users

1. **"I didn't receive the code"**
   - Check spam/junk folder
   - Verify email address is correct
   - Click "Resend Code" after 60 seconds

2. **"Code is invalid"**
   - Ensure entering all 6 digits
   - Check code hasn't expired (10 minutes)
   - Request new code if needed

3. **"Too many attempts"**
   - Wait 1 hour before trying again
   - Contact support if urgent

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check verification success rates
   - Monitor email delivery rates

2. **Monthly**
   - Clean up old verified OTPs (>30 days)
   - Review and update rate limits
   - Check for security updates

3. **Quarterly**
   - Security audit of verification flow
   - Performance optimization review
   - User experience feedback review

### Database Cleanup

```typescript
// Cleanup script (run periodically)
export const cleanupOldOTPs = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

    const oldOTPs = await ctx.db
      .query("emailVerificationOTP")
      .filter(q => q.and(
        q.eq(q.field("verified"), true),
        q.lt(q.field("verifiedAt"), thirtyDaysAgo)
      ))
      .collect()

    for (const otp of oldOTPs) {
      await ctx.db.delete(otp._id)
    }

    return { deleted: oldOTPs.length }
  }
})
```

## Future Enhancements

1. **Multi-factor Authentication**
   - Add SMS verification option
   - Support authenticator apps
   - Biometric verification

2. **Enhanced Security**
   - IP-based rate limiting
   - Device fingerprinting
   - Suspicious activity detection

3. **User Experience**
   - Auto-submit on 6 digits entered
   - Magic link option
   - Remember device feature

4. **Analytics**
   - Detailed verification funnel
   - A/B testing different flows
   - User behavior tracking