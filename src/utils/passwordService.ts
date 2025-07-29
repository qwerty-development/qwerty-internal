import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

// Simple encryption/decryption functions
// In production, you might want to use a more robust encryption library
function encryptPassword(password: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.PASSWORD_ENCRYPTION_KEY || "default-key",
    "salt",
    32
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptPassword(encryptedPassword: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.PASSWORD_ENCRYPTION_KEY || "default-key",
    "salt",
    32
  );
  const parts = encryptedPassword.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function storePasswordInDatabase(
  clientId: string,
  password: string,
  email: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const encryptedPassword = encryptPassword(password);

    const { error } = await supabase.from("password_storage").upsert({
      client_id: clientId,
      email: email,
      password_hash: encryptedPassword,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    if (error) {
      console.error("Error storing password:", error);
      return false;
    }

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

    const { data, error } = await supabase
      .from("password_storage")
      .select("password_hash, email, expires_at")
      .eq("client_id", clientId)
      .single();

    if (error || !data) {
      console.error("Error retrieving password:", error);
      return null;
    }

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

    const decryptedPassword = decryptPassword(data.password_hash);
    return {
      password: decryptedPassword,
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
