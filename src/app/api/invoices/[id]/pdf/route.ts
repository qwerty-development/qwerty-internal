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

    // Generate PDF HTML content using centralized branding
    const pdfHtml = await generateInvoicePDFWithBranding(
      invoice,
      client,
      invoiceItems,
      receipts || []
    );

    // Return the HTML content that will be converted to PDF on the client side
    return NextResponse.json({
      success: true,
      pdfHtml,
      invoice,
      client,
      items: invoiceItems,
      receipts: receipts || [],
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

async function generateInvoicePDFWithBranding(
  invoice: any,
  client: any,
  items: any[],
  receipts: any[]
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

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "PAID";
      case "partially_paid":
        return "PARTIALLY PAID";
      case "unpaid":
        return "UNPAID";
      default:
        return status.toUpperCase();
    }
  };

  // Generate the content HTML
  const content = `
    <div class="content">
      <div class="client-info">
        <div class="section-title">Bill To</div>
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

      <div class="invoice-info">
        <div class="section-title">Invoice Details</div>
        <div class="info-row">
          <div class="label">Issue Date</div>
          <div class="value">${formatDate(invoice.issue_date)}</div>
        </div>
        <div class="info-row">
          <div class="label">Due Date</div>
          <div class="value">${formatDate(invoice.due_date)}</div>
        </div>
        <div class="info-row">
          <div class="label">Status</div>
          <div class="value">
            <span class="status-badge status-${invoice.status
              .toLowerCase()
              .replace(" ", "_")}">${getStatusText(invoice.status)}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="label">Total Amount</div>
          <div class="value" style="font-size: 18px; font-weight: bold;">
            ${formatCurrency(invoice.total_amount)}
          </div>
        </div>
      </div>
    </div>

    ${
      items.length > 0
        ? `
    <div class="section-title">Items</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Item</th>
          <th style="text-align: right; width: 120px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item, index) => `
        <tr>
          <td class="item-number">${index + 1}</td>
          <td>
            <div class="item-title">${item.title}</div>
            ${
              item.description
                ? `<div class="item-description">${item.description}</div>`
                : ""
            }
          </td>
          <td class="item-price">${formatCurrency(item.price)}</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="2" style="text-align: right;"><strong>Total:</strong></td>
          <td class="item-price">${formatCurrency(invoice.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
    `
        : ""
    }

    <div class="payment-summary">
      <div class="section-title">Payment Summary</div>
      <div style="display: flex; justify-content: space-between; margin: 10px 0;">
        <div>
          <div class="label">Total Amount</div>
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

    ${
      receipts.length > 0
        ? `
    <div class="payment-history">
      <div class="section-title">Payment History</div>
      <table class="payment-history-table">
        <thead>
          <tr>
            <th>Receipt #</th>
            <th>Payment Date</th>
            <th>Amount</th>
            <th>Payment Method</th>
          </tr>
        </thead>
        <tbody>
          ${receipts
            .map(
              (receipt) => `
          <tr>
            <td>${receipt.receipt_number}</td>
            <td>${formatDate(receipt.payment_date)}</td>
            <td class="amount-paid">${formatCurrency(receipt.amount)}</td>
            <td>${receipt.payment_method}</td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : `
    <div class="payment-history">
      <div class="section-title">Payment History</div>
      <div class="no-payments">No payments have been made for this invoice yet.</div>
    </div>
    `
    }

    ${
      invoice.description
        ? `
    <div class="section-title">Description</div>
    <div class="description">
      ${invoice.description.replace(/\n/g, "<br>")}
    </div>
    `
        : ""
    }
  `;

  // Use the centralized branding service
  return await generatePDFTemplate("Invoice", invoice.invoice_number, content);
}
