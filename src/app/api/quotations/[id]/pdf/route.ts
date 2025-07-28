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
    const { id: quotationId } = await params;
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

    // Fetch quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Fetch quotation items if it uses items
    let quotationItems: any[] = [];
    if (quotation.uses_items) {
      const { data: items, error: itemsError } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("position");

      if (!itemsError && items) {
        quotationItems = items;
      }
    }

    // Generate PDF HTML content
    const pdfHtml = generateQuotationPDF(quotation, quotationItems);

    // Return the HTML content that will be converted to PDF on the client side
    return NextResponse.json({
      success: true,
      pdfHtml,
      quotation,
      items: quotationItems,
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

function generateQuotationPDF(quotation: any, items: any[]) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quotation ${quotation.quotation_number}</title>
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
        .quotation-number {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        .content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .client-info, .quotation-info {
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
          background-color: #f8fafc;
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
          background-color: #f8fafc;
          font-weight: bold;
        }
        .total-row td {
          border-top: 2px solid #e5e7eb;
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
        .status-draft { background-color: #f3f4f6; color: #374151; }
        .status-sent { background-color: #dbeafe; color: #1e40af; }
        .status-approved { background-color: #d1fae5; color: #065f46; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
        .status-converted { background-color: #f3e8ff; color: #7c3aed; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">QWERTY</div>
        <div class="document-type">QUOTATION</div>
        <div class="quotation-number">${quotation.quotation_number}</div>
      </div>

      <div class="content">
        <div class="client-info">
          <div class="section-title">Client Information</div>
          <div class="info-row">
            <div class="label">Name</div>
            <div class="value">${quotation.client_name}</div>
          </div>
          ${
            quotation.client_email
              ? `
          <div class="info-row">
            <div class="label">Email</div>
            <div class="value">${quotation.client_email}</div>
          </div>
          `
              : ""
          }
          ${
            quotation.client_phone
              ? `
          <div class="info-row">
            <div class="label">Phone</div>
            <div class="value">${quotation.client_phone}</div>
          </div>
          `
              : ""
          }
          ${
            quotation.client_address
              ? `
          <div class="info-row">
            <div class="label">Address</div>
            <div class="value">${quotation.client_address}</div>
          </div>
          `
              : ""
          }
        </div>

        <div class="quotation-info">
          <div class="section-title">Quotation Details</div>
          <div class="info-row">
            <div class="label">Issue Date</div>
            <div class="value">${formatDate(quotation.issue_date)}</div>
          </div>
          ${
            quotation.due_date
              ? `
          <div class="info-row">
            <div class="label">Due Date</div>
            <div class="value">${formatDate(quotation.due_date)}</div>
          </div>
          `
              : ""
          }
          <div class="info-row">
            <div class="label">Status</div>
            <div class="value">
              <span class="status-badge status-${quotation.status.toLowerCase()}">${
    quotation.status
  }</span>
            </div>
          </div>
          <div class="info-row">
            <div class="label">Total Amount</div>
            <div class="value" style="font-size: 18px; font-weight: bold; color: #2563eb;">
              ${formatCurrency(quotation.total_amount)}
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
            <td class="item-price">${formatCurrency(
              quotation.total_amount
            )}</td>
          </tr>
        </tfoot>
      </table>
      `
          : ""
      }

      ${
        quotation.description
          ? `
      <div class="section-title">Description</div>
      <div class="description">
        ${quotation.description.replace(/\n/g, "<br>")}
      </div>
      `
          : ""
      }

      <div class="footer">
        <p>This quotation is valid for 30 days from the issue date.</p>
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;
}
