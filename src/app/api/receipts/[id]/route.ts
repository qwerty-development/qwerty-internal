import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("Receipts API: Fetching receipt with ID:", id);

    const supabase = createServiceClient();
    console.log("Receipts API: Service client created successfully");

    // Fetch receipt with related data
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select(
        `
        *,
        clients (
          id,
          company_name,
          company_email,
          contact_phone,
          address
        ),
        invoices (
          id,
          invoice_number,
          total_amount,
          amount_paid,
          balance_due,
          status,
          issue_date,
          due_date,
          description
        )
      `
      )
      .eq("id", id)
      .single();

    if (receiptError) {
      console.error("Receipts API: Receipt fetch error:", receiptError);
      return NextResponse.json(
        { error: `Receipt not found: ${receiptError.message}` },
        { status: 404 }
      );
    }

    console.log("Receipts API: Receipt fetched successfully", receipt);

    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (error) {
    console.error("Receipts API: Unexpected error:", error);

    return NextResponse.json(
      {
        error: `Internal server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
