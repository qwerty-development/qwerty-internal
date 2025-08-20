import { createClient } from "@supabase/supabase-js";

export interface BrandingSettings {
  id?: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  logo_url?: string;
  footer_text?: string;
  created_at?: string;
  updated_at?: string;
}

// Default branding settings
export const defaultBranding: BrandingSettings = {
  company_name: "QWERTY",
  company_address: "",
  company_phone: "",
  company_email: "",
  company_website: "",
  primary_color: "#01303F",
  secondary_color: "#014a5f",
  accent_color: "#059669",
  font_family: "Arial, sans-serif",
  logo_url: "",
  footer_text: "Thank you for your business!",
};

// Create a service role client for server-side operations
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Fetch branding settings from database
export async function getBrandingSettings(): Promise<BrandingSettings> {
  try {
    const supabase = createServiceClient();

    const { data: branding, error } = await supabase
      .from("branding_settings")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching branding settings:", error);
      return defaultBranding;
    }

    return branding || defaultBranding;
  } catch (error) {
    console.error("Error in getBrandingSettings:", error);
    return defaultBranding;
  }
}

// Generate CSS styles based on branding settings
export function generateBrandingCSS(branding: BrandingSettings): string {
  const primaryColor = branding.primary_color || defaultBranding.primary_color;
  const secondaryColor = branding.secondary_color || defaultBranding.secondary_color;
  const accentColor = branding.accent_color || defaultBranding.accent_color;
  const fontFamily = branding.font_family || defaultBranding.font_family;

  return `
    /* Ensure print margins are explicit (kills unexpected top gaps) */
    @page {
      size: A4;
      margin: 8mm 12mm 12mm 12mm; /* top right bottom left – adjust to taste */
    }

    /* Remove any browser/renderer default margins in print context */
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important; /* override the body padding below */
      }
      .header {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      /* Avoid page breaks inside blocks */
      .header, .content, .footer {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }

    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      font-kerning: auto;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;                /* No default margins */
      padding: 0;               /* start with 0 here */
      color: #333;
      line-height: 1.6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', Arial, sans-serif;
      font-variant-ligatures: none;
      text-rendering: geometricPrecision;
      -webkit-text-stroke: 0.01em transparent;
    }

    /* Add controlled content padding to a wrapper instead of body.
       This avoids top print engines adding body margin/padding above the first element. */
    .page-wrap {
      padding: 12mm; /* visible padding for screen or pdf renderers that respect CSS (not @page) */
      padding-top: 8mm; /* slightly tighter on top */
    }
    /* When header is intentionally removed (e.g., quotations), add a subtle top padding */
    .page-wrap.no-header { padding-top: 6mm !important; }

    img { display: block; } /* avoids inline image baseline gap at the very top */

    .header {
      text-align: center;
      margin: 0 0 20px 0;   /* no top margin */
      border-bottom: 2px solid ${primaryColor};
      padding: 0 0 14px 0;  /* no top padding */
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: ${primaryColor};
      margin: 6px 0 4px 0;
    }
    .company-info {
      font-size: 12px;
      color: #666;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    .document-type {
      font-size: 16px;
      color: #666;
      margin: 0 0 6px 0;
    }
    .document-number {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }

    .content {
      display: flex;
      justify-content: space-between;
      margin: 16px 0 24px 0; /* smaller top margin */
      gap: 16px;
    }
    .client-info, .document-info { flex: 1; }

    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 10px 0 8px 0;
      color: ${primaryColor};
      border-bottom: 1px solid #e5e7eb;
      padding: 0 0 5px 0;
    }
    .info-row { margin: 6px 0; }
    .label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
    }
    .value { font-size: 14px; margin-top: 2px; }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
    }
    .items-table th {
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
      padding: 10px;
      text-align: left;
      font-weight: bold;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      font-size: 12px;
    }
    .items-table td {
      padding: 9px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
    }
    .item-number { text-align: center; font-weight: bold; color: ${primaryColor}; }
    .item-title { font-weight: bold; }
    .item-description { color: #666; font-size: 11px; }
    .item-price { text-align: right; font-weight: bold; white-space: nowrap; }
    .total-row { background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"}; font-weight: bold; }
    .total-row td { border-top: 2px solid #e5e7eb; }

    .payment-summary {
      margin: 14px 0;
      padding: 12px;
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
      border-left: 4px solid ${primaryColor};
    }

    .payment-history { margin: 14px 0; }
    .payment-history-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    .payment-history-table th {
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
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
      margin: 14px 0;
      padding: 12px;
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
      border-left: 4px solid ${primaryColor};
    }

    .footer {
      margin: 20px 0 0 0;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      padding: 12px 0 0 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .amount-paid { color: ${accentColor || "#059669"}; font-weight: bold; }
    .balance-due { color: #dc2626; font-weight: bold; }
    .no-payments { text-align: center; color: #666; font-style: italic; padding: 14px; }

    .status-draft { background-color: #f3f4f6; color: #374151; }
    .status-sent { background-color: #dbeafe; color: #1e40af; }
    .status-approved, .status-paid { background-color: #d1fae5; color: #065f46; }
    .status-rejected { background-color: #fee2e2; color: #991b1b; }
    .status-converted { background-color: #f3e8ff; color: #7c3aed; }
    .status-partially_paid { background-color: #fef3c7; color: #92400e; }

    /* Receipt-specific (kept, with tighter spacing) */
    .receipt-main { max-width: 600px; margin: 0 auto; padding: 16px; }
    .payment-amount-section {
      text-align: center; margin: 18px 0; padding: 22px;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 12px; border: 2px solid #059669;
    }
    .payment-amount-label {
      font-size: 13px; font-weight: bold; color: #059669; text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 8px;
    }
    .payment-amount { font-size: 30px; font-weight: bold; color: #059669; margin-bottom: 6px; }
    .payment-date { font-size: 14px; color: #666; font-weight: 500; }

    .receipt-details { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 18px; }
    .detail-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:600; color:#374151; font-size:14px; }
    .detail-value { font-weight:500; color:#1f2937; font-size:14px; }
    .payment-method { background:#dbeafe; color:#1e40af; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; text-transform:uppercase; }

    .client-section { margin-bottom:18px; }
    .client-name { font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:6px; }
    .client-contact, .client-address { font-size:14px; color:#6b7280; margin-bottom:4px; line-height:1.4; }

    .invoice-reference { background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:18px; }
    .invoice-number { font-size:16px; font-weight:bold; color:#1f2937; margin-bottom:12px; }
    .invoice-details { display:flex; justify-content:space-between; align-items:center; padding:6px 0; }
    .invoice-label { font-weight:500; color:#6b7280; font-size:14px; }
    .invoice-value { font-weight:600; color:#1f2937; font-size:14px; }

    .balance-remaining { color:#dc2626; }
    .balance-paid { color:#059669; }

    .payment-confirmation {
      text-align:center; padding:16px; background:#f0fdf4; border-radius:8px;
      border:1px solid #bbf7d0; margin-bottom:18px;
    }
    .confirmation-text { font-size:18px; font-weight:bold; color:#059669; margin-bottom:8px; }
    .confirmation-details { font-size:14px; color:#6b7280; line-height:1.5; }

    .notes-section { background:#f8fafc; padding:16px; border-radius:8px; }
    .notes-content { font-size:14px; color:#374151; line-height:1.5; margin-top:8px; }
  `;
}


// Generate company header HTML
export function generateCompanyHeader(
  branding: BrandingSettings,
  documentType: string,
  documentNumber: string
): string {
  // Allow suppressing the header by passing a special marker in documentType
  if (documentType.endsWith("_NoHeader")) {
    return "";
  }
  const companyInfo = [];

  if (branding.company_address) {
    companyInfo.push(branding.company_address);
  }
  if (branding.company_phone) {
    companyInfo.push(branding.company_phone);
  }
  if (branding.company_email) {
    companyInfo.push(branding.company_email);
  }
  if (branding.company_website) {
    companyInfo.push(branding.company_website);
  }

  return `
    <div class="header">
      ${
        branding.logo_url
          ? `
        <img
          src="${branding.logo_url}"
          alt="Company Logo"
          style="height: 60px; margin-bottom: 10px;"
        />
      `
          : ""
      }
      <div class="company-name">${branding.company_name}</div>
      ${
        companyInfo.length > 0
          ? `
        <div class="company-info">
          ${companyInfo.join("<br />")}
        </div>
      `
          : ""
      }
      <div class="document-type">${documentType.toUpperCase()}</div>
      <div class="document-number">${documentNumber}</div>
    </div>
  `;
}

// Generate footer HTML
export function generateFooter(branding: BrandingSettings): string {
  return `
    <div class="footer">
      <p>${branding.footer_text || defaultBranding.footer_text}</p>
      <p>Please remit payment by the due date to avoid late fees.</p>
    </div>
  `;
}

// Generate complete PDF HTML template
export async function generatePDFTemplate(documentType: string, documentNumber: string, content: string): Promise<string> {
  const branding = await getBrandingSettings();
  const css = generateBrandingCSS(branding);
  const header = generateCompanyHeader(branding, documentType, documentNumber);
  const noHeader = documentType.endsWith("_NoHeader");
  const footer = generateFooter(branding);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${documentType} ${documentNumber}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="page-wrap${noHeader ? ' no-header' : ''}">
          ${header}
          ${content}
          ${footer}
        </div>
      </body>
    </html>
  `;
}
