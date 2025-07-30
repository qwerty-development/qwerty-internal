import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfiguration } from '@/utils/emailService';

export async function GET() {
  try {
    const isValid = await testEmailConfiguration();
    
    return NextResponse.json({
      emailConfigValid: isValid,
      message: isValid ? 'Email configuration is working' : 'Email configuration failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json(
      { 
        emailConfigValid: false, 
        message: 'Error testing email configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
