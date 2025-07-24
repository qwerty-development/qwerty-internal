import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🚀 CONVERSION API CALLED - START");
  console.log("🆔 Quotation ID:", params.id);
  console.log("🆔 Quotation ID length:", params.id?.length);
  console.log("🆔 Quotation ID type:", typeof params.id);
  console.log("📡 Request method:", request.method);
  console.log("📡 Request URL:", request.url);
  console.log(
    "📡 Request headers:",
    Object.fromEntries(request.headers.entries())
  );

  try {
    console.log("🚀 CONVERSION API CALLED - INSIDE TRY");
    console.log("🆔 Quotation ID:", params.id);

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
      console.log("❌ Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Authenticated user:", session.user.id);
    const quotationId = params.id;

    // Validate quotation ID
    console.log("🔍 Validating quotation ID:", quotationId);
    if (!quotationId || quotationId.length < 10) {
      console.log("❌ Invalid quotation ID:", quotationId);
      return NextResponse.json(
        { error: "Invalid quotation ID" },
        { status: 400 }
      );
    }

    // Fetch quotation with all data
    console.log("📋 Fetching quotation data...");
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .single();

    if (quotationError || !quotation) {
      console.log("❌ Quotation not found:", quotationError);
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    console.log("📋 Quotation found:", {
      id: quotation.id,
      status: quotation.status,
      client_id: quotation.client_id,
      client_name: quotation.client_name,
      is_converted: quotation.is_converted,
      uses_items: quotation.uses_items,
    });

    // Check if quotation is already converted
    if (quotation.is_converted) {
      console.log("❌ Quotation already converted");
      return NextResponse.json(
        { error: "Quotation is already converted" },
        { status: 400 }
      );
    }

    // Check if quotation is approved
    if (quotation.status !== "Approved") {
      console.log(
        "❌ Quotation not approved, current status:",
        quotation.status
      );
      return NextResponse.json(
        { error: "Quotation must be approved before conversion" },
        { status: 400 }
      );
    }

    // Start transaction
    let clientId = quotation.client_id;
    console.log("👤 Initial client ID:", clientId);

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

    if (!clientId) {
      return NextResponse.json(
        { error: "No client available for invoice creation" },
        { status: 400 }
      );
    }

    // Get next invoice number
    const { data: lastInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("invoice_number", { ascending: false })
      .limit(1);

    let invoiceNumber = "INV-0001";
    if (lastInvoice && lastInvoice.length > 0) {
      const lastNumber = parseInt(lastInvoice[0].invoice_number.split("-")[1]);
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    // Create invoice
    console.log("Creating invoice with data:", {
      client_id: clientId,
      quotation_id: quotationId,
      invoice_number: invoiceNumber,
      issue_date: quotation.quotation_issue_date || quotation.issue_date,
      due_date:
        quotation.quotation_due_date ||
        quotation.due_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      description: quotation.description,
      total_amount: quotation.total_amount,
      status: "Unpaid",
      uses_items: quotation.uses_items || false,
    });

    const { data: invoiceRecord, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: clientId,
        quotation_id: quotationId,
        invoice_number: invoiceNumber,
        issue_date: quotation.quotation_issue_date || quotation.issue_date,
        due_date:
          quotation.quotation_due_date ||
          quotation.due_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        description: quotation.description,
        total_amount: quotation.total_amount,
        amount_paid: 0,
        balance_due: quotation.total_amount,
        status: "Unpaid",
        uses_items: quotation.uses_items || false,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 }
      );
    }

    console.log("Invoice created successfully:", invoiceRecord);

    // If quotation uses items, copy them to invoice items
    if (quotation.uses_items) {
      const { data: quotationItems, error: itemsError } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("position");

      if (itemsError) {
        console.error("Error fetching quotation items:", itemsError);
        // Continue without items rather than failing
      } else if (quotationItems && quotationItems.length > 0) {
        const invoiceItems = quotationItems.map((item, index) => ({
          invoice_id: invoiceRecord.id,
          position: index + 1,
          title: item.title,
          description: item.description,
          price: item.price,
        }));

        const { error: copyError } = await supabase
          .from("invoice_items")
          .insert(invoiceItems);

        if (copyError) {
          console.error("Error copying items:", copyError);
          // Continue without items rather than failing
        }
      }
    }

    // Update client's regular balance
    const { data: client } = await supabase
      .from("clients")
      .select("regular_balance")
      .eq("id", clientId)
      .single();

    if (client) {
      const newBalance = (client.regular_balance || 0) + quotation.total_amount;
      await supabase
        .from("clients")
        .update({ regular_balance: newBalance })
        .eq("id", clientId);
    }

    // Mark quotation as converted
    const { error: updateError } = await supabase
      .from("quotations")
      .update({
        status: "Converted",
        is_converted: true,
        converted_to_invoice_id: invoiceRecord.id,
      })
      .eq("id", quotationId);

    if (updateError) {
      console.error("Error updating quotation:", updateError);
      // Don't fail the whole operation, just log the error
    }

    const response = {
      success: true,
      message: "Quotation converted to invoice successfully",
      invoice: invoiceRecord,
      clientId: clientId,
    };

    console.log("Conversion response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in quotation conversion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
