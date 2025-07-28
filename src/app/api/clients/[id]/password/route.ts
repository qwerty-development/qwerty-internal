import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPassword } from "@/utils/passwordCache";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = (await params).id;
    const supabase = createServiceClient();

    console.log("Password API: Fetching password for client ID:", clientId);

    // First, verify the client exists
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("contact_email")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      console.error("Password API: Client not found");
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // Get the password from cache
    const cachedPassword = getPassword(clientId);

    if (!cachedPassword) {
      console.error("Password API: No original password found in cache");
      return NextResponse.json(
        {
          success: false,
          error:
            "No original password found for this client. The password may have expired or was not stored.",
        },
        { status: 404 }
      );
    }

    console.log("Password API: Successfully retrieved password from cache");

    return NextResponse.json({
      success: true,
      password: cachedPassword.password,
      email: cachedPassword.email,
      message: "Original password retrieved successfully",
    });
  } catch (error) {
    console.error("Password retrieval error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
