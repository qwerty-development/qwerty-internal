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
    
    // List all users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch auth users',
          details: authError.message
        },
        { status: 500 }
      );
    }

    // Get users from users table
    const { data: appUsers, error: appError } = await supabase
      .from('users')
      .select('*');

    if (appError) {
      console.error('Error fetching app users:', appError);
    }

    // Get clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*');

    if (clientError) {
      console.error('Error fetching clients:', clientError);
    }

    return NextResponse.json({
      authUsers: authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at
      })),
      appUsers: appUsers || [],
      clients: clients || [],
      counts: {
        authUsers: authUsers.users.length,
        appUsers: appUsers?.length || 0,
        clients: clients?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in debug users:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
