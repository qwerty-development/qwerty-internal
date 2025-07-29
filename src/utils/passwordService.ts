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

// Simplified version without encryption for debugging
export async function storePasswordInDatabase(
  clientId: string,
  password: string,
  email: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    console.log("Storing password for client:", clientId, "email:", email);

    const { data, error } = await supabase
      .from("password_storage")
      .upsert({
        client_id: clientId,
        email: email,
        password_hash: password, // Store plain text temporarily for debugging
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
      })
      .select();

    if (error) {
      console.error("Error storing password:", error);
      return false;
    }

    console.log("Password stored successfully:", data);
    return true;
  } catch (error) {
    console.error("Error in storePasswordInDatabase:", error);
    return false;
  }
}

export async function getPasswordFromDatabase(
  clientId: string
): Promise<{ password: string; email: string } | null> {
  try {
    const supabase = createServiceClient();

    console.log("Retrieving password for client:", clientId);

    const { data, error } = await supabase
      .from("password_storage")
      .select("password_hash, email, expires_at")
      .eq("client_id", clientId)
      .single();

    if (error) {
      console.error("Error retrieving password:", error);
      return null;
    }

    if (!data) {
      console.log("No password data found for client:", clientId);
      return null;
    }

    console.log("Found password data:", data);

    // Check if password has expired
    if (new Date(data.expires_at) < new Date()) {
      console.log("Password has expired for client:", clientId);
      // Clean up expired password
      await supabase
        .from("password_storage")
        .delete()
        .eq("client_id", clientId);
      return null;
    }

    return {
      password: data.password_hash, // Return plain text temporarily
      email: data.email,
    };
  } catch (error) {
    console.error("Error in getPasswordFromDatabase:", error);
    return null;
  }
}

export async function removePasswordFromDatabase(
  clientId: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("password_storage")
      .delete()
      .eq("client_id", clientId);

    if (error) {
      console.error("Error removing password:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in removePasswordFromDatabase:", error);
    return false;
  }
}

export async function cleanupExpiredPasswords(): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("password_storage")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Error cleaning up expired passwords:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in cleanupExpiredPasswords:", error);
    return false;
  }
}
