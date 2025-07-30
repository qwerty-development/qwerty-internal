import nodemailer from 'nodemailer';

// Create transporter using your email service
const createTransporter = () => {
  // Check if all required environment variables are present
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Missing email configuration: EMAIL_USER and EMAIL_PASS are required');
  }

  console.log('Creating email transporter with user:', process.env.EMAIL_USER);
  
  // For Gmail, you'll need to use App Password instead of regular password
  // Go to Google Account Settings > Security > 2-Step Verification > App passwords
  return nodemailer.createTransport({
    service: 'gmail', // or use 'smtp.gmail.com'
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS, // Your Gmail App Password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Alternative transporter for other email services
const createCustomTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function sendPasswordResetEmail(
  to: string, 
  resetToken: string, 
  userName?: string
): Promise<boolean> {
  try {
    console.log('Attempting to send password reset email to:', to);
    
    const transporter = createTransporter();
    
    // Test the connection first
    console.log('Testing email transporter connection...');
    await transporter.verify();
    console.log('Email transporter connection successful');
    
    // Create the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('Reset URL:', resetUrl);
    
    const mailOptions = {
      from: `"QWERTY Support" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Password Reset Request - QWERTY Internal System',
      text: `
Hello ${userName || 'User'},

You have requested to reset your password for your QWERTY Internal System account.

Please click on the following link to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
QWERTY Support Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #01303F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">QWERTY Internal System</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
            <h2 style="color: #01303F; margin-top: 0;">Password Reset Request</h2>
            
            <p>Hello ${userName || 'User'},</p>
            
            <p>You have requested to reset your password for your QWERTY Internal System account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #059669; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
              If you did not request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
              Best regards,<br>
              QWERTY Support Team
            </p>
          </div>
        </div>
      `
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    console.log('Email info:', info);
    
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

export async function testEmailConfiguration(): Promise<boolean> {
  try {
    console.log('Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}
