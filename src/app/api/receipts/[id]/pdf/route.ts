import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { generateReceiptPDFWithBranding } from "@/utils/receiptPdfGenerator";

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
    const { id: receiptId } = await params;
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

    // Fetch receipt details with related data
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select(
        `
        *,
        clients (
          id,
          company_name,
          company_email,
          contact_person_name,
          contact_person_email,
          contact_phone,
          address,
          mof_number,
          notes
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
      .eq("id", receiptId)
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json(
        { success: false, error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Extract client and invoice data
    const client = receipt.clients;
    const invoice = receipt.invoices;

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Generate PDF HTML content using centralized branding
    const pdfHtml = await generateReceiptPDFWithBranding(
      receipt,
      client,
      invoice
    );

    // Return the HTML content that will be converted to PDF on the client side
    return NextResponse.json({
      success: true,
      pdfHtml,
      receipt: {
        id: receipt.id,
        receipt_number: receipt.receipt_number,
        payment_date: receipt.payment_date,
        amount: receipt.amount,
        payment_method: receipt.payment_method,
        created_at: receipt.created_at,
      },
      client: {
        id: client.id,
        company_name: client.company_name,
        company_email: client.company_email,
        contact_person_name: client.contact_person_name,
        contact_person_email: client.contact_person_email,
        contact_phone: client.contact_phone,
        address: client.address,
        mof_number: client.mof_number,
        notes: client.notes,
      },
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        amount_paid: invoice.amount_paid,
        balance_due: invoice.balance_due,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        description: invoice.description,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
