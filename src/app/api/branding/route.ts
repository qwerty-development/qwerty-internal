import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

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

// GET - Fetch branding settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get the current authenticated user
    const supabaseServer = await createServerClient();
    const {
      data: { session },
    } = await supabaseServer.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userError || userProfile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch branding settings
    const { data: branding, error: brandingError } = await supabase
      .from("branding_settings")
      .select("*")
      .single();

    if (brandingError && brandingError.code !== "PGRST116") {
      // PGRST116 is "not found" - we'll create default settings
      return NextResponse.json(
        { success: false, error: "Failed to fetch branding settings" },
        { status: 500 }
      );
    }

    // Return default settings if none exist
    const defaultSettings = {
      company_name: "QWERTY",
      company_address: "",
      company_phone: "",
      company_email: "",
      company_website: "",
      primary_color: "#01303F",
      secondary_color: "#014a5f",
      accent_color: "#059669",
      font_family: "Arial, sans-serif",
      logo_url: "",
      footer_text: "Thank you for your business!",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      branding: branding || defaultSettings,
    });
  } catch (error) {
    console.error("Branding fetch error:", error);
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

// POST - Update branding settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    // Get the current authenticated user
    const supabaseServer = await createServerClient();
    const {
      data: { session },
    } = await supabaseServer.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userError || userProfile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Validate required fields
    const requiredFields = ["company_name", "primary_color"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate color format
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(body.primary_color)) {
      return NextResponse.json(
        { success: false, error: "Invalid primary color format" },
        { status: 400 }
      );
    }

    // Check if branding settings exist
    const { data: existingBranding } = await supabase
      .from("branding_settings")
      .select("id")
      .single();

    let result;
    if (existingBranding) {
      // Update existing settings
      result = await supabase
        .from("branding_settings")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBranding.id)
        .select()
        .single();
    } else {
      // Create new settings
      result = await supabase
        .from("branding_settings")
        .insert({
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save branding settings: ${result.error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      branding: result.data,
    });
  } catch (error) {
    console.error("Branding update error:", error);
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
