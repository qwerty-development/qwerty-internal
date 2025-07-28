import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            return (await cookies()).getAll();
          },
          async setAll(cookiesToSet) {
            try {
              const cookieStore = await cookies();
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch recent quotations
    const { data: quotations, error } = await supabase
      .from("quotations")
      .select("id, quotation_number, status, client_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching quotations:", error);
      return NextResponse.json(
        { error: "Failed to fetch quotations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quotations: quotations || [],
      count: quotations?.length || 0,
    });
  } catch (error) {
    console.error("Debug quotations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
