import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { generatePDFTemplate } from "@/utils/brandingService";

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

export { generateReceiptPDFWithBranding };

async function generateReceiptPDFWithBranding(
  receipt: any,
  client: any,
  invoice: any
) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "card":
        return "bg-blue-100 text-blue-800";
      case "bank transfer":
        return "bg-purple-100 text-purple-800";
      case "check":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate the content HTML
  const content = `
    <div class="receipt-main">
      <!-- Payment Amount - Most Prominent -->
      <div class="payment-amount-section">
        <div class="payment-amount-label">PAYMENT RECEIVED</div>
        <div class="payment-amount">${formatCurrency(receipt.amount)}</div>
        <div class="payment-date">${formatDate(receipt.payment_date)}</div>
      </div>

      <!-- Receipt Details -->
      <div class="receipt-details">
        <div class="detail-row">
          <span class="detail-label">Receipt Number:</span>
          <span class="detail-value">${receipt.receipt_number}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span class="detail-value payment-method">${
            receipt.payment_method
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formatDate(receipt.payment_date)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${new Date(
            receipt.created_at
          ).toLocaleTimeString()}</span>
        </div>
      </div>

      <!-- Client Information -->
      <div class="client-section">
        <div class="section-title">PAID BY</div>
        <div class="client-name">${client.company_name}</div>
        ${
          client.contact_person_name
            ? `<div class="client-contact">${client.contact_person_name}</div>`
            : ""
        }
        ${
          client.company_email
            ? `<div class="client-contact">${client.company_email}</div>`
            : ""
        }
        ${
          client.contact_person_email
            ? `<div class="client-contact">${client.contact_person_email}</div>`
            : ""
        }
        ${
          client.contact_phone
            ? `<div class="client-contact">${client.contact_phone}</div>`
            : ""
        }
        ${
          client.mof_number
            ? `<div class="client-contact">MOF: ${client.mof_number}</div>`
            : ""
        }
        ${
          client.address
            ? `<div class="client-address">${client.address}</div>`
            : ""
        }
        ${client.notes ? `<div class="client-notes">${client.notes}</div>` : ""}
      </div>

      <!-- Invoice Reference -->
      <div class="invoice-reference">
        <div class="section-title">FOR INVOICE</div>
        <div class="invoice-number">${invoice.invoice_number}</div>
        <div class="invoice-details">
          <span class="invoice-label">Total:</span>
          <span class="invoice-value">${formatCurrency(
            invoice.total_amount
          )}</span>
        </div>
        <div class="invoice-details">
          <span class="invoice-label">Paid to Date:</span>
          <span class="invoice-value">${formatCurrency(
            invoice.amount_paid || 0
          )}</span>
        </div>
        <div class="invoice-details">
          <span class="invoice-label">Balance:</span>
          <span class="invoice-value ${
            invoice.balance_due > 0 ? "balance-remaining" : "balance-paid"
          }">${formatCurrency(invoice.balance_due || 0)}</span>
        </div>
      </div>

      <!-- Payment Confirmation -->
      <div class="payment-confirmation">
        <div class="confirmation-text">✓ Payment Confirmed</div>
        <div class="confirmation-details">
          This receipt serves as proof of payment for the above amount.
          Please retain this document for your records.
        </div>
      </div>

      <!-- Additional Notes -->
      ${
        invoice.description
          ? `
      <div class="notes-section">
        <div class="section-title">INVOICE DESCRIPTION</div>
        <div class="notes-content">
          ${invoice.description.replace(/\n/g, "<br>")}
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;

  // Use the centralized branding service
  return await generatePDFTemplate("Receipt", receipt.receipt_number, content);
}
