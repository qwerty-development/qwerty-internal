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
  const currency = quotation?.currency || "USD";

  const formatCurrency = (amount: number) => {
    if (amount == null || isNaN(Number(amount))) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const safeDate = (d?: string | null) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const formatDate = (dateString?: string | null) => {
    const dt = safeDate(dateString);
    return dt ? dt.toLocaleDateString() : "-";
  };

  const totalFromItems =
    Array.isArray(items) && items.length
      ? items.reduce((sum, it) => sum + (Number(it.price) || 0), 0)
      : null;

  const total = quotation?.total_amount ?? totalFromItems ?? 0;

  // Scope all styles to .quotation-doc so we don’t fight with your branding template.
  const content = `
  <style>
    /* Page + print rules */
    @page {
      size: A4;
      margin: 0mm 14mm 14mm 14mm; /* Remove top margin to avoid large top space */
    }
    /* Nuke any top padding/margin from the shared template */
    html, body { margin: 0 !important; padding: 0 !important; }
    .page-wrap { padding-top: 0 !important; }
    .header { display: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; }
    .quotation-doc { margin-top: 0 !important; }
    .quotation-doc {
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
      color: #0f172a; /* slate-900 */
      font-size: 12px; /* compact default */
      line-height: 1.35;
    }
    .quotation-doc * { box-sizing: border-box; }
    .quotation-doc h1,
    .quotation-doc h2,
    .quotation-doc h3 { margin: 0; }
    .quotation-doc .muted { color: #475569; } /* slate-600 */

    /* Layout */
    .q-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10mm 8mm; /* vertical/horizontal gaps */
      margin-bottom: 10mm;
    }

    .section {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .2px;
      margin: 0 0 6px 0;
      color: #111827; /* gray-900 */
    }

    /* Info blocks */
    .info-block {
      border: 1px solid #e5e7eb; /* gray-200 */
      border-radius: 8px;
      padding: 6mm;
    }
    .info-row {
      display: grid;
      grid-template-columns: 32mm 1fr;
      gap: 6mm;
      padding: 3px 0;
    }
    .label {
      color: #64748b; /* slate-500 */
      font-weight: 600;
      white-space: nowrap;
    }
    .value { color: #0f172a; }

    /* Status badge */
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid #cbd5e1; /* slate-300 */
      background: #f8fafc; /* slate-50 */
    }
    .status-accepted { color: #065f46; border-color: #a7f3d0; background: #ecfdf5; } /* emerald */
    .status-pending  { color: #92400e; border-color: #fde68a; background: #fffbeb; } /* amber */
    .status-rejected { color: #7f1d1d; border-color: #fecaca; background: #fef2f2; } /* red */

    /* Totals pill */
    .total-box {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 5mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8mm;
      margin-top: 4mm;
      background: #fafafa;
      break-inside: avoid;
    }
    .total-box .total-label { font-weight: 700; letter-spacing: .2px; }
    .total-box .total-value {
      font-size: 16px;
      font-weight: 800;
    }

    /* Items table */
    .items-wrap { margin-top: 6mm; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      table-layout: fixed; /* avoid unexpected wrapping */
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .items th, .items td {
      padding: 6px 8px;
      vertical-align: top;
    }
    .items thead th {
      text-align: left;
      background: #f8fafc; /* slate-50 */
      font-size: 11px;
      color: #475569; /* slate-600 */
      border-bottom: 1px solid #e5e7eb;
    }
    .items tbody tr {
      border-bottom: 1px solid #f1f5f9; /* slate-100 */
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .items tfoot td {
      border-top: 1px solid #e5e7eb;
      font-weight: 700;
    }
    .num { width: 14mm; text-align: center; color: #64748b; }
    .price { width: 26mm; text-align: right; white-space: nowrap; }
    .item-title { font-weight: 600; }
    .item-desc { color: #475569; font-size: 11px; margin-top: 2px; }

    /* Free text blocks */
    .prose {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 5mm;
      margin-top: 5mm;
      background: #fff;
      break-inside: avoid;
    }
    .prose p { margin: 0 0 6px 0; }
    .prose p:last-child { margin-bottom: 0; }

    /* Subtle header (within content area—your branding template can still render the global header) */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin: 0 0 6mm 0;
      padding-bottom: 4mm;
      border-bottom: 1px solid #e5e7eb;
    }
    .doc-title { font-size: 18px; font-weight: 800; }
    .doc-sub { font-size: 12px; color: #475569; }
  </style>

  <div class="quotation-doc">
    <div class="doc-header">
      <div class="doc-title">Quotation</div>
      <div class="doc-sub">
        ${quotation?.quotation_number ? `Ref: ${quotation.quotation_number}` : ""}
        ${quotation?.issue_date ? ` • Issued: ${formatDate(quotation.issue_date)}` : ""}
      </div>
    </div>

    <div class="q-grid">
      <div class="section">
        <div class="section-title">Client Information</div>
        <div class="info-block">
          <div class="info-row">
            <div class="label">Company</div>
            <div class="value">${quotation.company_name || "N/A"}</div>
          </div>
          ${quotation.company_email ? `
          <div class="info-row">
            <div class="label">Company Email</div>
            <div class="value">${quotation.company_email}</div>
          </div>` : ""}
          ${quotation.contact_person_name ? `
          <div class="info-row">
            <div class="label">Contact</div>
            <div class="value">${quotation.contact_person_name}</div>
          </div>` : ""}
          ${quotation.contact_person_email ? `
          <div class="info-row">
            <div class="label">Contact Email</div>
            <div class="value">${quotation.contact_person_email}</div>
          </div>` : ""}
          ${quotation.contact_phone ? `
          <div class="info-row">
            <div class="label">Phone</div>
            <div class="value">${quotation.contact_phone}</div>
          </div>` : ""}
          ${quotation.mof_number ? `
          <div class="info-row">
            <div class="label">MOF Number</div>
            <div class="value">${quotation.mof_number}</div>
          </div>` : ""}
          ${quotation.address ? `
          <div class="info-row">
            <div class="label">Address</div>
            <div class="value">${quotation.address}</div>
          </div>` : ""}
          ${quotation.notes ? `
          <div class="info-row">
            <div class="label">Notes</div>
            <div class="value">${quotation.notes}</div>
          </div>` : ""}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Quotation Details</div>
        <div class="info-block">
          <div class="info-row">
            <div class="label">Issue Date</div>
            <div class="value">${formatDate(quotation.issue_date)}</div>
          </div>
          ${quotation.due_date ? `
          <div class="info-row">
            <div class="label">Due Date</div>
            <div class="value">${formatDate(quotation.due_date)}</div>
          </div>` : ""}
          <div class="info-row">
            <div class="label">Status</div>
            <div class="value">
              <span class="status-badge status-${(quotation.status || "pending").toLowerCase()}">
                ${(quotation.status || "PENDING").toString().toUpperCase()}
              </span>
            </div>
          </div>
          <div class="total-box">
            <div class="total-label">Total Amount</div>
            <div class="total-value">${formatCurrency(total)}</div>
          </div>
        </div>
      </div>
    </div>

    ${Array.isArray(items) && items.length ? `
    <div class="section items-wrap">
      <div class="section-title">Items</div>
      <table class="items">
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Item</th>
            <th class="price">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => `
            <tr>
              <td class="num">${idx + 1}</td>
              <td>
                <div class="item-title">${item.title || "-"}</div>
                ${item.description ? `<div class="item-desc">${item.description}</div>` : ""}
              </td>
              <td class="price">${formatCurrency(item.price)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="text-align:right;">Total</td>
            <td class="price">${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ` : ""}

    ${quotation.description ? `
    <div class="section">
      <div class="section-title">Description</div>
      <div class="prose">
        ${String(quotation.description).trim().split("\n").map(p => `<p>${p}</p>`).join("")}
      </div>
    </div>` : ""}

    ${quotation.terms_and_conditions ? `
    <div class="section">
      <div class="section-title">Terms & Conditions</div>
      <div class="prose">
        ${String(quotation.terms_and_conditions).trim().split("\n").map(p => `<p>${p}</p>`).join("")}
      </div>
    </div>` : ""}
  </div>
  `;

  // Keep using your centralized branding template. It should simply inject `content` into its body.
  // Use special document type to suppress global header and remove top padding
  return await generatePDFTemplate("Quotation_NoHeader", quotation.quotation_number, content);
}
