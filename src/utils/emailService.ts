const nodemailer = require("nodemailer");
import { getBrandingSettings } from "./brandingService";

// Debug: Check if nodemailer is properly imported
console.log("Nodemailer version:", nodemailer.version);
console.log(
  "createTransport function exists:",
  typeof nodemailer.createTransport === "function"
);

// Email configuration - you can update these settings
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

// Email templates
export const emailTemplates = {
  invoice: {
    subject: (invoiceNumber: string, companyName: string) =>
      `Invoice ${invoiceNumber} from ${companyName}`,
    html: (
      invoiceNumber: string,
      clientName: string,
      totalAmount: number,
      companyName: string,
      companyEmail: string
    ) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #01303F; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .amount { font-size: 18px; font-weight: bold; color: #01303F; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
          </div>
          <div class="content">
            <h2>Invoice ${invoiceNumber}</h2>
            <p>Dear ${clientName},</p>
            <p>Please find attached your invoice <strong>${invoiceNumber}</strong> for the total amount of <span class="amount">$${totalAmount.toFixed(
      2
    )}</span>.</p>
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>The ${companyName} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Contact: ${companyEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  receipt: {
    subject: (receiptNumber: string, companyName: string) =>
      `Receipt ${receiptNumber} from ${companyName}`,
    html: (
      receiptNumber: string,
      clientName: string,
      amount: number,
      companyName: string,
      companyEmail: string
    ) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #01303F; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .amount { font-size: 18px; font-weight: bold; color: #01303F; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
          </div>
          <div class="content">
            <h2>Receipt ${receiptNumber}</h2>
            <p>Dear ${clientName},</p>
            <p>Thank you for your payment! Please find attached your receipt <strong>${receiptNumber}</strong> for the amount of <span class="amount">$${amount.toFixed(
      2
    )}</span>.</p>
            <p>We appreciate your business and look forward to serving you again.</p>
            <p>Best regards,<br>The ${companyName} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Contact: ${companyEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
};

// Send invoice email
export async function sendInvoiceEmail(
  toEmail: string,
  clientName: string,
  invoiceNumber: string,
  totalAmount: number,
  pdfBuffer: Buffer
): Promise<boolean> {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(
        "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables."
      );
      throw new Error(
        "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables."
      );
    }

    const transporter = createTransporter();
    const branding = await getBrandingSettings();

    const mailOptions = {
      from: `"${branding.company_name}" <${emailConfig.auth.user}>`,
      to: toEmail,
      subject: emailTemplates.invoice.subject(
        invoiceNumber,
        branding.company_name
      ),
      html: emailTemplates.invoice.html(
        invoiceNumber,
        clientName,
        totalAmount,
        branding.company_name,
        branding.company_email || emailConfig.auth.user
      ),
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Invoice email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending invoice email:", error);
    throw error; // Re-throw to get the actual error message
  }
}

// Send receipt email
export async function sendReceiptEmail(
  toEmail: string,
  clientName: string,
  receiptNumber: string,
  amount: number,
  pdfBuffer: Buffer
): Promise<boolean> {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(
        "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables."
      );
      throw new Error(
        "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables."
      );
    }

    const transporter = createTransporter();
    const branding = await getBrandingSettings();

    const mailOptions = {
      from: `"${branding.company_name}" <${emailConfig.auth.user}>`,
      to: toEmail,
      subject: emailTemplates.receipt.subject(
        receiptNumber,
        branding.company_name
      ),
      html: emailTemplates.receipt.html(
        receiptNumber,
        clientName,
        amount,
        branding.company_name,
        branding.company_email || emailConfig.auth.user
      ),
      attachments: [
        {
          filename: `receipt-${receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Receipt email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    throw error; // Re-throw to get the actual error message
  }
}
