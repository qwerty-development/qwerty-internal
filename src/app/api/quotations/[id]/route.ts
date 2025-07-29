import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/quotations/[id] - Fetch quotation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quotationId } = await params;
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quotationId } = await params;
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

    const updateData = await request.json();

    // Validate required fields
    if (!updateData.company_name?.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    if (!updateData.company_email?.trim()) {
      return NextResponse.json(
        { error: "Company email is required" },
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
      company_name: updateData.company_name.trim(),
      company_email: updateData.company_email.trim(),
      contact_person_name: updateData.contact_person_name?.trim() || null,
      contact_person_email: updateData.contact_person_email?.trim() || null,
      contact_phone: updateData.contact_phone?.trim() || null,
      address: updateData.address?.trim() || null,
      mof_number: updateData.mof_number?.trim() || null,
      notes: updateData.notes?.trim() || null,

      // Quotation data
      description: updateData.description.trim(),
      terms_and_conditions: updateData.terms_and_conditions?.trim() || null,
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
