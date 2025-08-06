# Email System Explanation

## Overview

This document explains how the email system works in the QWERTY application. The system allows users to send invoice and receipt PDFs directly to clients via email.

## How It Works (Step by Step)

### 1. User Interface

- **Where**: Invoice/Receipt detail pages (`/admin/invoices/[id]` and `/admin/receipts/[id]`)
- **What**: A blue "Send Email" button appears next to the "Generate PDF" button
- **When**: Only shows if the client has a `company_email` address

### 2. Frontend (React Component)

When the user clicks "Send Email":

```typescript
// In the invoice/receipt detail page
const handleSendEmail = async () => {
  setIsSendingEmail(true);
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
      method: "POST",
    });
    // Handle success/error
  } catch (error) {
    // Show error message
  }
};
```

### 3. API Route (Backend)

The request goes to `/api/invoices/[id]/send-email` or `/api/receipts/[id]/send-email`:

#### What the API does:

1. **Authentication**: Checks if user is logged in
2. **Fetch Data**: Gets invoice/receipt, client, and related data from database
3. **Validate**: Ensures client has an email address
4. **Generate PDF**: Creates PDF content using existing PDF generation functions
5. **Convert to Buffer**: Uses jsPDF to convert HTML to PDF buffer
6. **Send Email**: Uses Nodemailer to send email with PDF attached
7. **Return Response**: Success/error message back to frontend

### 4. PDF Generation Process

#### Step 4a: Get HTML Content

```typescript
// Import the existing PDF generation function
const { generateInvoicePDFWithBranding } = await import(
  "@/app/api/invoices/[id]/pdf/route"
);

// Generate HTML content (same as when downloading PDF)
const pdfHtml = await generateInvoicePDFWithBranding(
  invoice,
  client,
  items,
  receipts
);
```

#### Step 4b: Convert HTML to PDF Buffer

```typescript
// Use jsPDF to convert HTML to PDF buffer
const pdfBuffer = await generateInvoicePDFBuffer(pdfHtml);
```

**Why jsPDF?**

- The existing PDF system uses client-side libraries (jsPDF, html2canvas) for direct download
- For email attachments, we need a server-side PDF buffer
- jsPDF is a pure JavaScript library that works well in serverless environments like Vercel
- No need for Chrome/headless browser installation

### 5. Email Sending Process

#### Step 5a: Email Configuration

```typescript
// Environment variables (in .env.local)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp.gmail.com (default)
SMTP_PORT=587 (default)
```

#### Step 5b: Create Email

```typescript
// Use Nodemailer to send email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

#### Step 5c: Send with Attachment

```typescript
const mailOptions = {
  from: '"QWERTY" <your-email@gmail.com>',
  to: client.company_email,
  subject: `Invoice ${invoiceNumber} from QWERTY`,
  html: emailTemplate, // Pre-formatted HTML email
  attachments: [
    {
      filename: `invoice-${invoiceNumber}.pdf`,
      content: pdfBuffer, // The PDF buffer we generated
      contentType: "application/pdf",
    },
  ],
};

await transporter.sendMail(mailOptions);
```

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── invoices/[id]/page.tsx          # Invoice detail page with "Send Email" button
│   │   └── receipts/[id]/page.tsx          # Receipt detail page with "Send Email" button
│   └── api/
│       ├── invoices/[id]/
│       │   ├── pdf/route.ts                # Existing PDF generation (HTML)
│       │   └── send-email/route.ts         # NEW: Email sending API
│       └── receipts/[id]/
│           ├── pdf/route.ts                # Existing PDF generation (HTML)
│           └── send-email/route.ts         # NEW: Email sending API
├── utils/
│   ├── emailService.ts                     # NEW: Email templates and sending logic
│   └── serverPdfGenerator.ts               # NEW: Server-side PDF generation
```

## Key Components

### 1. `emailService.ts`

- **Purpose**: Centralized email sending logic
- **Contains**: Email templates, Nodemailer configuration, send functions
- **Templates**: Pre-formatted HTML emails for invoices and receipts

### 2. `serverPdfGenerator.ts`

- **Purpose**: Convert HTML to PDF buffer for email attachments
- **Uses**: jsPDF (pure JavaScript PDF library)
- **Input**: HTML content from existing PDF generation
- **Output**: PDF buffer for email attachment

### 3. Email API Routes

- **Purpose**: Orchestrate the entire email sending process
- **Steps**: Fetch data → Generate PDF → Send email → Return response

## Environment Variables Required

```bash
# In .env.local
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
# Optional (defaults to Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## Email Templates

The system uses pre-formatted HTML email templates that include:

- Company branding (QWERTY header)
- Professional formatting
- Clear subject lines
- PDF attachment information

## Security & Validation

- **Authentication**: Only logged-in users can send emails
- **Email Validation**: Only sends if client has a valid email address
- **Error Handling**: Comprehensive error messages for debugging
- **Environment Variables**: Secure credential storage

## Testing

1. **Configuration Test**: Visit `/api/test-email-config` to verify environment variables
2. **Email Test**: Try sending an email from an invoice/receipt detail page
3. **Error Handling**: Check browser console and server logs for detailed error messages

## Troubleshooting

### Common Issues:

1. **"createTransporter is not a function"**: Fixed - was a typo in function name
2. **"Email credentials not configured"**: Set EMAIL_USER and EMAIL_PASS in .env.local
3. **PDF generation errors**: Now uses jsPDF which works reliably in serverless environments

## Deployment Notes

- **Vercel Compatible**: Uses jsPDF instead of Puppeteer for better serverless compatibility
- **No Chrome Required**: Pure JavaScript solution works in all environments
- **Fast Generation**: jsPDF is lightweight and fast for PDF generation
