import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin operations
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing environment variables: URL=${!!supabaseUrl}, ServiceKey=${!!supabaseServiceKey}`
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Test if password_reset_tokens table exists
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('count')
      .limit(1);

    const tableExists = !error;

    return NextResponse.json({
      tableExists,
      error: error ? error.message : null,
      message: tableExists 
        ? 'password_reset_tokens table exists and is accessible' 
        : 'password_reset_tokens table does not exist or is not accessible'
    });

  } catch (error) {
    console.error('Error checking table:', error);
    return NextResponse.json(
      { 
        tableExists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check table existence'
      },
      { status: 500 }
    );
  }
}
