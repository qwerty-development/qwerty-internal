import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/quotations/[id]/items - Fetch quotation items
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const quotationId = params.id;

    // Fetch quotation items ordered by position
    const { data: items, error } = await supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching quotation items:", error);
      return NextResponse.json(
        { error: "Failed to fetch quotation items" },
        { status: 500 }
      );
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error("Error in GET /api/quotations/[id]/items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/quotations/[id]/items - Update quotation items (replaces all items)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const quotationId = params.id;
    const items = await request.json();

    // Validate items array
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.title || typeof item.price !== "number" || item.price < 0) {
        return NextResponse.json(
          { error: "Each item must have a title and non-negative price" },
          { status: 400 }
        );
      }
    }

    // Start a transaction
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select("uses_items")
      .eq("id", quotationId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Delete existing items
    const { error: deleteError } = await supabase
      .from("quotation_items")
      .delete()
      .eq("quotation_id", quotationId);

    if (deleteError) {
      console.error("Error deleting existing items:", deleteError);
      return NextResponse.json(
        { error: "Failed to update quotation items" },
        { status: 500 }
      );
    }

    // Insert new items with positions
    const itemsToInsert = items.map((item, index) => ({
      quotation_id: quotationId,
      position: index + 1,
      title: item.title.trim(),
      description: item.description?.trim() || null,
      price: item.price,
    }));

    const { data: newItems, error: insertError } = await supabase
      .from("quotation_items")
      .insert(itemsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting new items:", insertError);
      return NextResponse.json(
        { error: "Failed to update quotation items" },
        { status: 500 }
      );
    }

    // Update quotation to use items system
    if (!quotation.uses_items) {
      const { error: updateError } = await supabase
        .from("quotations")
        .update({ uses_items: true })
        .eq("id", quotationId);

      if (updateError) {
        console.error("Error updating quotation uses_items:", updateError);
      }
    }

    return NextResponse.json(newItems);
  } catch (error) {
    console.error("Error in POST /api/quotations/[id]/items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
