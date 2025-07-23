import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Missing environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get a client ID
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name")
      .limit(1);

    if (clientsError) {
      return NextResponse.json(
        { error: `Failed to fetch clients: ${clientsError.message}` },
        { status: 500 }
      );
    }

    // Get an invoice ID
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, invoice_number")
      .limit(1);

    if (invoicesError) {
      return NextResponse.json(
        { error: `Failed to fetch invoices: ${invoicesError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      client: clients && clients.length > 0 ? clients[0] : null,
      invoice: invoices && invoices.length > 0 ? invoices[0] : null,
    });
  } catch (error) {
    console.error("Test IDs: Unexpected error:", error);
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
