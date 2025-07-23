import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Test DB: Checking environment variables...");
    console.log("Test DB: URL exists:", !!supabaseUrl);
    console.log("Test DB: Service key exists:", !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Missing environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Test DB: Testing database connection...");

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from("invoices")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Test DB: Database connection failed:", testError);
      return NextResponse.json(
        { error: `Database connection failed: ${testError.message}` },
        { status: 500 }
      );
    }

    console.log("Test DB: Database connection successful");

    // Test users table
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (usersError) {
      console.error("Test DB: Users table access failed:", usersError);
      return NextResponse.json(
        { error: `Users table access failed: ${usersError.message}` },
        { status: 500 }
      );
    }

    console.log("Test DB: Users table access successful");

    return NextResponse.json({
      success: true,
      message: "Database connection and access successful",
      hasUsers: users && users.length > 0,
      userCount: users ? users.length : 0,
    });
  } catch (error) {
    console.error("Test DB: Unexpected error:", error);
    return NextResponse.json(
      {
        error: `Test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
