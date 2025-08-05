import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { sendReceiptEmail } from "@/utils/emailService";
import { generateReceiptPDFBuffer } from "@/utils/serverPdfGenerator";

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

export async function POST(
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

    // Check if client has email
    if (!client.company_email) {
      return NextResponse.json(
        { success: false, error: "Client does not have an email address" },
        { status: 400 }
      );
    }

    // Import the PDF generation function from the utility
    const { generateReceiptPDFWithBranding } = await import(
      "@/utils/receiptPdfGenerator"
    );

    // Generate PDF HTML content
    const pdfHtml = await generateReceiptPDFWithBranding(
      receipt,
      client,
      invoice
    );

    // Generate PDF buffer
    const pdfBuffer = await generateReceiptPDFBuffer(pdfHtml);

    // Send email
    const emailSent = await sendReceiptEmail(
      client.company_email,
      client.company_name,
      receipt.receipt_number,
      receipt.amount,
      pdfBuffer
    );

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Receipt ${receipt.receipt_number} sent successfully to ${client.company_email}`,
    });
  } catch (error) {
    console.error("Email sending error:", error);
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
