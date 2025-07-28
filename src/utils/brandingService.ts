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
  const secondaryColor =
    branding.secondary_color || defaultBranding.secondary_color;
  const accentColor = branding.accent_color || defaultBranding.accent_color;
  const fontFamily = branding.font_family || defaultBranding.font_family;

  return `
    body {
      font-family: ${fontFamily};
      margin: 0;
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 20px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 5px;
    }
    .company-info {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }
    .document-type {
      font-size: 18px;
      color: #666;
      margin-bottom: 10px;
    }
    .document-number {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
    .content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .client-info, .document-info {
      flex: 1;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      color: ${primaryColor};
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
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
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
      color: ${primaryColor};
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
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
      font-weight: bold;
    }
    .total-row td {
      border-top: 2px solid #e5e7eb;
    }
    .payment-summary {
      margin: 20px 0;
      padding: 15px;
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
      border-left: 4px solid ${primaryColor};
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
      margin: 20px 0;
      padding: 15px;
      background-color: ${secondaryColor ? `${secondaryColor}20` : "#f0fdf4"};
      border-left: 4px solid ${primaryColor};
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
      color: ${accentColor || "#059669"};
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
    .status-draft { background-color: #f3f4f6; color: #374151; }
    .status-sent { background-color: #dbeafe; color: #1e40af; }
    .status-approved { background-color: #d1fae5; color: #065f46; }
    .status-rejected { background-color: #fee2e2; color: #991b1b; }
    .status-converted { background-color: #f3e8ff; color: #7c3aed; }
    .status-paid { background-color: #d1fae5; color: #065f46; }
    .status-partially_paid { background-color: #fef3c7; color: #92400e; }
    .status-unpaid { background-color: #fee2e2; color: #991b1b; }
  `;
}

// Generate company header HTML
export function generateCompanyHeader(
  branding: BrandingSettings,
  documentType: string,
  documentNumber: string
): string {
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
export async function generatePDFTemplate(
  documentType: string,
  documentNumber: string,
  content: string
): Promise<string> {
  const branding = await getBrandingSettings();
  const css = generateBrandingCSS(branding);
  const header = generateCompanyHeader(branding, documentType, documentNumber);
  const footer = generateFooter(branding);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${documentType} ${documentNumber}</title>
      <style>
        ${css}
      </style>
    </head>
    <body>
      ${header}
      ${content}
      ${footer}
    </body>
    </html>
  `;
}
