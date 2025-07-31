# Email System Setup Guide

## Overview

The email system allows you to send invoice and receipt PDFs directly to clients via email. The system uses Nodemailer with SMTP configuration.

## Environment Variables Setup

Add the following variables to your `.env.local` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Email Provider Setup

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

### Other Email Providers

You can use any SMTP provider. Common configurations:

**Outlook/Hotmail:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**SendGrid:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

**Custom SMTP:**

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## Testing the Email System

1. **Create an invoice or receipt** in the admin panel
2. **Navigate to the detail page**
3. **Click "Send Email"** button
4. **Check the client's email** for the PDF attachment

## Email Templates

The system includes pre-formatted email templates:

### Invoice Email

- Subject: "Invoice [NUMBER] from QWERTY"
- Includes invoice number and total amount
- Professional formatting with company branding

### Receipt Email

- Subject: "Receipt [NUMBER] from QWERTY"
- Includes receipt number and payment amount
- Thank you message for payment

## Troubleshooting

### Common Issues

1. **"Authentication failed"**

   - Check your SMTP credentials
   - Ensure 2FA is enabled for Gmail
   - Verify app password is correct

2. **"Connection timeout"**

   - Check your internet connection
   - Verify SMTP host and port
   - Check firewall settings

3. **"Email not received"**
   - Check spam/junk folder
   - Verify client email address is correct
   - Check email provider settings

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
DEBUG_EMAIL=true
```

## Security Notes

- Never commit your `.env.local` file to version control
- Use app passwords instead of your main password
- Regularly rotate your email credentials
- Monitor email sending logs for unusual activity
