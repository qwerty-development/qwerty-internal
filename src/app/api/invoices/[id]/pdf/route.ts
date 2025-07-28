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

    // Generate PDF HTML content
    const pdfHtml = generateInvoicePDF(
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

function generateInvoicePDF(
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "background-color: #d1fae5; color: #065f46;";
      case "partially_paid":
        return "background-color: #fef3c7; color: #92400e;";
      case "unpaid":
        return "background-color: #fee2e2; color: #991b1b;";
      default:
        return "background-color: #f3f4f6; color: #374151;";
    }
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #059669;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 5px;
        }
        .document-type {
          font-size: 18px;
          color: #666;
          margin-bottom: 10px;
        }
        .invoice-number {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        .content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .client-info, .invoice-info {
          flex: 1;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #059669;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .info-row {
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
          color: #666;
          font-size: 12px;
        }
        .value {
          font-size: 14px;
          margin-top: 2px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th {
          background-color: #f0fdf4;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .item-number {
          text-align: center;
          font-weight: bold;
          color: #059669;
        }
        .item-title {
          font-weight: bold;
        }
        .item-description {
          color: #666;
          font-size: 12px;
        }
        .item-price {
          text-align: right;
          font-weight: bold;
        }
        .total-row {
          background-color: #f0fdf4;
          font-weight: bold;
        }
        .total-row td {
          border-top: 2px solid #e5e7eb;
        }
        .payment-summary {
          margin: 20px 0;
          padding: 15px;
          background-color: #f0fdf4;
          border-left: 4px solid #059669;
        }
        .payment-history {
          margin: 20px 0;
        }
        .payment-history-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        .payment-history-table th {
          background-color: #f0fdf4;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          font-size: 11px;
        }
        .payment-history-table td {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
        }
        .description {
          margin: 20px 0;
          padding: 15px;
          background-color: #f0fdf4;
          border-left: 4px solid #059669;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .amount-paid {
          color: #059669;
          font-weight: bold;
        }
        .balance-due {
          color: #dc2626;
          font-weight: bold;
        }
        .no-payments {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Acme Corporation</div>
        <div class="document-type">INVOICE</div>
        <div class="invoice-number">${invoice.invoice_number}</div>
      </div>

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
              <span class="status-badge" style="${getStatusColor(
                invoice.status
              )}">${getStatusText(invoice.status)}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="label">Total Amount</div>
            <div class="value" style="font-size: 18px; font-weight: bold; color: #059669;">
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

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Please remit payment by the due date to avoid late fees.</p>
      </div>
    </body>
    </html>
  `;
}
