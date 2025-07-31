import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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

    // Fetch quotation with all client data
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Check if quotation is already approved
    if (quotation.status === "Approved") {
      return NextResponse.json(
        { error: "Quotation is already approved" },
        { status: 400 }
      );
    }

    // Determine the mode and handle client creation/assignment
    let clientId = quotation.client_id;
    let clientCreated = false;

    // If no client is assigned (new client mode), create one from quotation data
    if (!clientId && quotation.company_name) {
      // Check if client with this company name already exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("company_name", quotation.company_name)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client from quotation data
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            company_name: quotation.company_name,
            company_email: quotation.company_email || null,
            contact_person_name: quotation.contact_person_name || null,
            contact_person_email: quotation.contact_person_email || null,
            contact_phone: quotation.contact_phone || null,
            address: quotation.address || null,
            mof_number: quotation.mof_number || null,
            notes: quotation.notes || null,
            regular_balance: 0,
            paid_amount: 0,
          })
          .select()
          .single();

        if (clientError) {
          console.error("Error creating client:", clientError);
          return NextResponse.json(
            { error: "Failed to create client from quotation data" },
            { status: 500 }
          );
        }

        clientId = newClient.id;
        clientCreated = true;
      }
    }

    // Update quotation status and assign client if needed
    const updateData: any = {
      status: "Approved",
      approved_at: new Date().toISOString(),
    };

    // Only update client_id if we have one and it's different from current
    if (clientId && clientId !== quotation.client_id) {
      updateData.client_id = clientId;
    }

    const { error: updateError } = await supabase
      .from("quotations")
      .update(updateData)
      .eq("id", quotationId);

    if (updateError) {
      console.error("Error updating quotation:", updateError);
      return NextResponse.json(
        { error: "Failed to approve quotation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quotation approved successfully",
      clientId: clientId,
      clientCreated: clientCreated,
    });
  } catch (error) {
    console.error("Error in quotation approval:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
