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

    // Generate PDF HTML content using centralized branding
    const pdfHtml = await generateQuotationPDFWithBranding(
      quotation,
      quotationItems
    );

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

async function generateQuotationPDFWithBranding(quotation: any, items: any[]) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Generate the content HTML
  const content = `
    <div class="content">
      <div class="client-info">
        <div class="section-title">Client Information</div>
        <div class="info-row">
          <div class="label">Name</div>
          <div class="value">${quotation.client_name || "N/A"}</div>
        </div>
        ${quotation.client_email ? `
        <div class="info-row">
          <div class="label">Email</div>
          <div class="value">${quotation.client_email}</div>
        </div>
        ` : ''}
        ${quotation.client_phone ? `
        <div class="info-row">
          <div class="label">Phone</div>
          <div class="value">${quotation.client_phone}</div>
        </div>
        ` : ''}
        ${quotation.client_address ? `
        <div class="info-row">
          <div class="label">Address</div>
          <div class="value">${quotation.client_address}</div>
        </div>
        ` : ''}
      </div>

      <div class="quotation-info">
        <div class="section-title">Quotation Details</div>
        <div class="info-row">
          <div class="label">Issue Date</div>
          <div class="value">${formatDate(quotation.issue_date)}</div>
        </div>
        ${quotation.due_date ? `
        <div class="info-row">
          <div class="label">Due Date</div>
          <div class="value">${formatDate(quotation.due_date)}</div>
        </div>
        ` : ''}
        <div class="info-row">
          <div class="label">Status</div>
          <div class="value">
            <span class="status-badge status-${quotation.status.toLowerCase()}">${quotation.status.toUpperCase()}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="label">Total Amount</div>
          <div class="value" style="font-size: 18px; font-weight: bold;">
            ${formatCurrency(quotation.total_amount)}
          </div>
        </div>
      </div>
    </div>

    ${items.length > 0 ? `
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
        ${items.map((item, index) => `
        <tr>
          <td class="item-number">${index + 1}</td>
          <td>
            <div class="item-title">${item.title}</div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
          </td>
          <td class="item-price">${formatCurrency(item.price)}</td>
        </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="2" style="text-align: right;"><strong>Total:</strong></td>
          <td class="item-price">${formatCurrency(quotation.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
    ` : ''}

    ${quotation.description ? `
    <div class="section-title">Description</div>
    <div class="description">
      ${quotation.description.replace(/\n/g, '<br>')}
    </div>
    ` : ''}
  `;

  // Use the centralized branding service
  return await generatePDFTemplate("Quotation", quotation.quotation_number, content);
}
