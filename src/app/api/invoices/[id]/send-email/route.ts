import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { sendInvoiceEmail } from "@/utils/emailService";
import { generateInvoicePDFBuffer } from "@/utils/serverPdfGenerator";

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
    const { id: invoiceId } = await params;
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

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", invoice.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
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

    // Fetch invoice items if it uses items
    let invoiceItems: any[] = [];
    if (invoice.uses_items) {
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("position");

      if (!itemsError && items) {
        invoiceItems = items;
      }
    }

    // Fetch payment history (receipts)
    const { data: receipts, error: receiptsError } = await supabase
      .from("receipts")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: false });

    if (receiptsError) {
      console.error("Error fetching receipts:", receiptsError);
      // Continue without receipts rather than failing
    }

    // Import the PDF generation function dynamically to avoid circular dependencies
    const { generateInvoicePDFWithBranding } = await import(
      "@/app/api/invoices/[id]/pdf/route"
    );

    // Generate PDF HTML content
    const pdfHtml = await generateInvoicePDFWithBranding(
      invoice,
      client,
      invoiceItems,
      receipts || []
    );

    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePDFBuffer(pdfHtml);

    // Send email
    const emailSent = await sendInvoiceEmail(
      client.company_email,
      client.company_name,
      invoice.invoice_number,
      invoice.total_amount,
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
      message: `Invoice ${invoice.invoice_number} sent successfully to ${client.company_email}`,
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
