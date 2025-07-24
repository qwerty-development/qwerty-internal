import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/quotations/[id] - Fetch quotation details
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
          getAll() {
            return cookies().getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookies().set(name, value, options)
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

    // Fetch quotation details
    const { data: quotation, error } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .single();

    if (error) {
      console.error("Error fetching quotation:", error);
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error in GET /api/quotations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/quotations/[id] - Update quotation details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookies().set(name, value, options)
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
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.clientName?.trim()) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!updateData.description?.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (!updateData.quotationIssueDate) {
      return NextResponse.json(
        { error: "Issue date is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const quotationUpdate = {
      // Client data
      client_name: updateData.clientName.trim(),
      client_email: updateData.clientEmail?.trim() || null,
      client_phone: updateData.clientPhone?.trim() || null,
      client_contact_email: updateData.clientContactEmail?.trim() || null,
      client_contact_phone: updateData.clientContactPhone?.trim() || null,
      client_address: updateData.clientAddress?.trim() || null,
      client_notes: updateData.clientNotes?.trim() || null,

      // Quotation data
      description: updateData.description.trim(),
      quotation_issue_date: updateData.quotationIssueDate,
      quotation_due_date: updateData.quotationDueDate || null,

      // Keep the old fields for backward compatibility
      issue_date: updateData.quotationIssueDate,
      due_date: updateData.quotationDueDate || null,
    };

    // Update quotation
    const { data: updatedQuotation, error } = await supabase
      .from("quotations")
      .update(quotationUpdate)
      .eq("id", quotationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating quotation:", error);
      return NextResponse.json(
        { error: "Failed to update quotation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quotation: updatedQuotation,
      message: "Quotation updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/quotations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
