import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/utils/passwordResetService';
import { sendPasswordResetEmail } from '@/utils/emailService';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create a password reset token
    const resetToken = await createPasswordResetToken(email);

    if (!resetToken) {
      // Don't reveal whether the email exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Send the password reset email (we'll get the user name inside the service if needed)
    const emailSent = await sendPasswordResetEmail(
      email, 
      resetToken, 
      undefined // We'll handle user name lookup separately if needed
    );

    if (!emailSent) {
      console.error('Failed to send password reset email');
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
