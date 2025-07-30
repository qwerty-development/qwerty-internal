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

export async function POST() {
  try {
    const supabase = createServiceClient();

    // Create the password_reset_tokens table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      query: createTableQuery 
    });

    if (createError) {
      console.error('Error creating table:', createError);
      // Try alternative approach
      const { error: altError } = await supabase
        .from('password_reset_tokens')
        .select('id')
        .limit(1);
      
      if (altError && altError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Table does not exist and could not be created automatically. Please run the SQL migration manually.',
            sql: createTableQuery
          },
          { status: 500 }
        );
      }
    }

    // Create indexes
    const createIndexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);',
      'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);'
    ];

    for (const indexQuery of createIndexQueries) {
      await supabase.rpc('exec_sql', { query: indexQuery });
    }

    // Test the table by checking if it exists
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to verify table creation',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password reset tokens table created successfully',
      tableExists: true
    });

  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
