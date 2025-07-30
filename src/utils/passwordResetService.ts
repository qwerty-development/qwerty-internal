import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';

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

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export async function createPasswordResetToken(userEmail: string): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    
    // First, find the user by email
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      return null;
    }

    const user = authUser.users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error('User not found with email:', userEmail);
      return null;
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    // Store the token in the database
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt,
        used: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing reset token:', error);
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error in createPasswordResetToken:', error);
    return null;
  }
}

export async function verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    // Check if token has expired
    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, userId: data.user_id };
  } catch (error) {
    console.error('Error in verifyPasswordResetToken:', error);
    return { valid: false, error: 'Internal server error' };
  }
}

export async function markTokenAsUsed(token: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    if (error) {
      console.error('Error marking token as used:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markTokenAsUsed:', error);
    return false;
  }
}

export async function cleanupExpiredTokens(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('password_reset_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired tokens:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in cleanupExpiredTokens:', error);
    return false;
  }
}
