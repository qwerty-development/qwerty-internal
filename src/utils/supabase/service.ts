import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not set in environment variables"
  );
}

export const createServiceClient = () => {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
