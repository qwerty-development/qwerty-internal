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
          name,
          contact_email,
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
        name: client.name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address,
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
    <div class="content">
      <div class="client-info">
        <div class="section-title">Payment From</div>
        <div class="info-row">
          <div class="label">Name</div>
          <div class="value">${client.name}</div>
        </div>
        ${
          client.contact_email
            ? `
        <div class="info-row">
          <div class="label">Email</div>
          <div class="value">${client.contact_email}</div>
        </div>
        `
            : ""
        }
        ${
          client.contact_phone
            ? `
        <div class="info-row">
          <div class="label">Phone</div>
          <div class="value">${client.contact_phone}</div>
        </div>
        `
            : ""
        }
        ${
          client.address
            ? `
        <div class="info-row">
          <div class="label">Address</div>
          <div class="value">${client.address}</div>
        </div>
        `
            : ""
        }
      </div>

      <div class="receipt-info">
        <div class="section-title">Receipt Details</div>
        <div class="info-row">
          <div class="label">Receipt Number</div>
          <div class="value">${receipt.receipt_number}</div>
        </div>
        <div class="info-row">
          <div class="label">Payment Date</div>
          <div class="value">${formatDate(receipt.payment_date)}</div>
        </div>
        <div class="info-row">
          <div class="label">Payment Method</div>
          <div class="value">
            <span class="payment-method-badge ${getPaymentMethodColor(
              receipt.payment_method
            )}">${receipt.payment_method}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="label">Amount Paid</div>
          <div class="value" style="font-size: 18px; font-weight: bold; color: #059669;">
            ${formatCurrency(receipt.amount)}
          </div>
        </div>
      </div>
    </div>

    <div class="invoice-info">
      <div class="section-title">Related Invoice</div>
      <div class="info-row">
        <div class="label">Invoice Number</div>
        <div class="value">${invoice.invoice_number}</div>
      </div>
      <div class="info-row">
        <div class="label">Issue Date</div>
        <div class="value">${formatDate(invoice.issue_date)}</div>
      </div>
      <div class="info-row">
        <div class="label">Due Date</div>
        <div class="value">${formatDate(invoice.due_date)}</div>
      </div>
      <div class="info-row">
        <div class="label">Invoice Status</div>
        <div class="value">
          <span class="status-badge status-${invoice.status
            .toLowerCase()
            .replace(" ", "_")}">${invoice.status.toUpperCase()}</span>
        </div>
      </div>
    </div>

    <div class="payment-summary">
      <div class="section-title">Payment Summary</div>
      <div style="display: flex; justify-content: space-between; margin: 10px 0;">
        <div>
          <div class="label">Invoice Total</div>
          <div class="value">${formatCurrency(invoice.total_amount)}</div>
        </div>
        <div>
          <div class="label">Amount Paid</div>
          <div class="value amount-paid">${formatCurrency(
            invoice.amount_paid || 0
          )}</div>
        </div>
        <div>
          <div class="label">Balance Due</div>
          <div class="value balance-due">${formatCurrency(
            invoice.balance_due || 0
          )}</div>
        </div>
      </div>
    </div>

    <div class="payment-details">
      <div class="section-title">Payment Details</div>
      <table class="payment-details-table">
        <tbody>
          <tr>
            <td class="label">Receipt Number</td>
            <td class="value">${receipt.receipt_number}</td>
          </tr>
          <tr>
            <td class="label">Payment Date</td>
            <td class="value">${formatDate(receipt.payment_date)}</td>
          </tr>
          <tr>
            <td class="label">Payment Method</td>
            <td class="value">${receipt.payment_method}</td>
          </tr>
          <tr>
            <td class="label">Amount Paid</td>
            <td class="value amount-paid">${formatCurrency(receipt.amount)}</td>
          </tr>
          <tr>
            <td class="label">Created</td>
            <td class="value">${formatDate(receipt.created_at)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${
      invoice.description
        ? `
    <div class="section-title">Invoice Description</div>
    <div class="description">
      ${invoice.description.replace(/\n/g, "<br>")}
    </div>
    `
        : ""
    }
  `;

  // Use the centralized branding service
  return await generatePDFTemplate("Receipt", receipt.receipt_number, content);
}
