# Forgot Password Feature Documentation

## Overview
The forgot password feature allows users to reset their passwords via email. This feature uses Nodemailer for email sending and secure token-based password reset functionality.

## Flow Overview
1. User clicks "Forgot your password?" on signin page
2. User enters their email address
3. System generates a secure token and sends reset email
4. User clicks the link in the email
5. User enters new password on reset page
6. Password is updated and user can sign in

## Components

### 1. ForgotPasswordModal (`src/components/ForgotPasswordModal.tsx`)
- Modal component shown when user clicks "Forgot your password?"
- Handles email submission for password reset request
- Shows success message after email is sent

### 2. Reset Password Page (`src/app/reset-password/page.tsx`)
- Standalone page for password reset
- Accessible via email link with token parameter
- Handles password validation and update

### 3. API Routes

#### `/api/auth/forgot-password` (POST)
- Accepts email address
- Generates secure reset token
- Sends password reset email
- Returns success message (doesn't reveal if email exists)

#### `/api/auth/reset-password` (POST)
- Accepts token and new password
- Verifies token validity and expiration
- Updates user password in Supabase Auth
- Marks token as used

### 4. Utility Services

#### Email Service (`src/utils/emailService.ts`)
- Configures Nodemailer transporter
- Sends branded password reset emails
- Supports Gmail and custom SMTP configurations

#### Password Reset Service (`src/utils/passwordResetService.ts`)
- Manages password reset tokens
- Creates, verifies, and invalidates tokens
- Handles token expiration (1 hour)

## Database Schema

### password_reset_tokens table
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security > 2-Step Verification
   - App passwords > Generate
3. Use the generated password as `EMAIL_PASS`

### Environment Variables
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Alternative SMTP Providers
You can use other email providers by configuring:
```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
EMAIL_USER=your-email
EMAIL_PASS=your-password
```

## Security Features

### Token Security
- Tokens are generated using crypto.randomBytes(32)
- Tokens expire after 1 hour
- Tokens are single-use (marked as used after password reset)
- Expired tokens are automatically cleaned up

### Email Security
- Generic success message (doesn't reveal if email exists)
- HTML email with clear branding and security warnings
- Reset links include full domain validation

### Password Security
- Minimum 6 character requirement
- Password confirmation validation
- Direct update via Supabase Auth admin API

## Testing

### Local Testing with Ethereal
For development, you can use Ethereal.email test accounts:
```javascript
// In emailService.ts, use createCustomTransporter with:
host: "smtp.ethereal.email",
port: 587,
auth: {
  user: "test@ethereal.email",
  pass: "test-password"
}
```

### Production Testing
1. Set up real email credentials
2. Test with actual email addresses
3. Verify email delivery and formatting
4. Test token expiration behavior

## Integration Points

### Signin Page Updates
- Added "Forgot your password?" link
- Integrated ForgotPasswordModal
- Maintains existing password change modal functionality

### User Experience
- Consistent QWERTY branding in emails
- Mobile-responsive email templates
- Clear error messaging and success states
- Automatic redirect after successful reset

## Troubleshooting

### Common Issues
1. **Email not sending**: Check EMAIL_USER and EMAIL_PASS environment variables
2. **Token invalid**: Verify token hasn't expired or been used
3. **Password update fails**: Check Supabase service role permissions

### Debugging
- Check server logs for email sending errors
- Verify database table exists and has correct structure
- Test email configuration with test endpoints
- Monitor token creation and expiration

## Future Enhancements
- Email template customization via admin panel
- Rate limiting for password reset requests
- Additional email providers support
- Password strength requirements configuration
- Multi-language email templates
