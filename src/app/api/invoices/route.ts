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

interface InvoiceData {
  client_id: string;
  issue_date: string;
  due_date: string;
  description: string;
  total_amount: number;
  created_by?: string;
}

// Generate next invoice number
async function getNextInvoiceNumber(supabase: any): Promise<string> {
  const { data: lastInvoice, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("invoice_number", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to get last invoice number: ${error.message}`);
  }

  if (!lastInvoice) {
    return "INV-001";
  }

  // Extract number from last invoice number (e.g., "INV-001" -> 1)
  const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
  if (!match) {
    return "INV-001";
  }

  const lastNumber = parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;
  return `INV-${nextNumber.toString().padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData: InvoiceData = await request.json();
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

    // Validate required fields
    if (!invoiceData.client_id) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 }
      );
    }

    if (!invoiceData.description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }

    if (!invoiceData.total_amount || invoiceData.total_amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Total amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, regular_balance")
      .eq("id", invoiceData.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber(supabase);

    // Create invoice
    const { data: invoiceRecord, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: invoiceData.client_id,
        invoice_number: invoiceNumber,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        description: invoiceData.description.trim(),
        total_amount: invoiceData.total_amount,
        amount_paid: 0,
        balance_due: invoiceData.total_amount,
        status: "unpaid",
        created_by: session.user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json(
        {
          success: false,
          error: `Invoice creation failed: ${invoiceError.message}`,
        },
        { status: 400 }
      );
    }

    // Update client's regular balance
    const newBalance = (client.regular_balance || 0) + invoiceData.total_amount;
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        regular_balance: newBalance,
      })
      .eq("id", invoiceData.client_id);

    if (updateError) {
      console.error("Failed to update client balance:", updateError);
      // Don't fail the entire operation if balance update fails
    }

    return NextResponse.json({
      success: true,
      invoice: invoiceRecord,
      message: "Invoice created successfully!",
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to create invoice",
      },
      { status: 500 }
    );
  }
}
