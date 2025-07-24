import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

    // Start transaction
    let clientId = quotation.client_id;

    // If no client is assigned, create one from quotation data
    if (!clientId && quotation.client_name) {
      // Check if client with this name already exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("name", quotation.client_name)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client from quotation data
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            name: quotation.client_name,
            contact_email:
              quotation.client_contact_email || quotation.client_email || null,
            contact_phone:
              quotation.client_contact_phone || quotation.client_phone || null,
            address: quotation.client_address || null,
            notes: quotation.client_notes || null,
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
      }
    }

    // Update quotation status and assign client
    const updateData: any = {
      status: "Approved",
      approved_at: new Date().toISOString(),
    };

    if (clientId && !quotation.client_id) {
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
    });
  } catch (error) {
    console.error("Error in quotation approval:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
