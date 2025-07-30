import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("password_storage")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (error) {
      console.error("Error fetching password storage:", error);
      return NextResponse.json(
        { error: "Failed to fetch password storage data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data,
      message: "Password storage data retrieved successfully"
    });

  } catch (error) {
    console.error("Error in debug password storage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("password_storage")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all password storage:", error);
      return NextResponse.json(
        { error: "Failed to fetch password storage data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data,
      count: data?.length || 0,
      message: "All password storage data retrieved successfully"
    });

  } catch (error) {
    console.error("Error in debug password storage GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
