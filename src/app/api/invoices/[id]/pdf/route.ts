import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import {
  generatePDFTemplate,
  getBrandingSettings,
} from "@/utils/brandingService";

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

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "status-paid";
      case "partially_paid":
        return "status-pending";
      case "unpaid":
        return "status-overdue";
      default:
        return "status-pending";
    }
  };

  // Get branding settings for company info
  const branding = await getBrandingSettings();

  // Generate items table rows
  const itemsRows =
    items.length > 0
      ? items
          .map(
            (item, index) => `
        <tr>
          <td class="item-number">${index + 1}</td>
          <td>
            <div class="item-title">${item.title}</div>
          </td>
          <td>
            <div class="item-description">${item.description || ""}</div>
          </td>
          <td style="text-align: center;">1</td>
          <td class="item-price">${formatCurrency(item.price)}</td>
        </tr>
      `
          )
          .join("")
      : `
        <tr>
          <td class="item-number">1</td>
          <td>
            <div class="item-title">Invoice Item</div>
          </td>
          <td>
            <div class="item-description">Invoice description</div>
          </td>
          <td style="text-align: center;">1</td>
          <td class="item-price">${formatCurrency(invoice.total_amount)}</td>
          <td class="item-price">${formatCurrency(invoice.total_amount)}</td>
        </tr>
      `;

  // Generate payment history
  const paymentHistory =
    receipts.length > 0
      ? `
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
      `
      : `<div class="no-payments">No payments have been made for this invoice yet.</div>`;

  // Generate client address
  const clientAddress = client.address
    ? client.address.split("\n").join("<br>")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            /* Improve text rendering */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-kerning: auto;
        }

        body {
            /* Use system fonts for better rendering */
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            /* Improve text sharpness */
            font-variant-ligatures: none;
            text-rendering: geometricPrecision;
            -webkit-text-stroke: 0.01em transparent; /* Micro-stroke for sharper text */
        }

        .invoice-container {
            width: 100%;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            overflow: hidden;
            /* Remove any CSS transforms that can cause blurriness */
        }

        .invoice-container * {
            transform: none !important;
            will-change: auto !important;
        }

        /* Header Styles */
        .invoice-header {
            background-color: #01303f;
            color: white;
            padding: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            /* Ensure pixel-perfect positioning */
            position: relative;
            top: 0;
            left: 0;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .logo-container {

            border-radius: 8px;
            width: 360px;
            height: 200px;
            display: flex;
            align-items: left;
            justify-content: left;
        }

        .logo-container img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            filter: none;
        }

        /* Fallback for missing logo */
        .logo-placeholder {
            color: #01303f;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            display: none;
        }

        .invoice-title {
            font-size: 48px;
            font-weight: bold;
            margin-left: 20px;
        }

        .header-right {
            text-align: right;
            line-height: 1.6;
        }

        .business-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .business-info {
            /* For very small text, use slightly larger sizes */
            font-size: 12px; /* Instead of 11px */
            opacity: 0.9;
            line-height: 1.3;
        }

        /* Content Styles */
        .invoice-content {
            padding: 40px;
            /* Ensure pixel-perfect positioning */
            position: relative;
            top: 0;
            left: 0;
        }

        .invoice-details-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 40px;
        }

        .section-group {
            flex: 1;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #01303f;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .info-row {
            display: flex;
            margin-bottom: 8px;
            align-items: flex-start;
        }

        .label {
            font-weight: bold;
            color: #666;
            min-width: 140px;
            margin-right: 10px;
            /* For very small text, use slightly larger sizes */
            font-size: 12px; /* Instead of 11px */
            line-height: 1.3;
        }

        .value {
            color: #333;
            flex: 1;
            /* For very small text, use slightly larger sizes */
            font-size: 12px; /* Instead of 11px */
            line-height: 1.3;
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }

        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-overdue {
            background-color: #f8d7da;
            color: #721c24;
        }

        /* Compact Description for First Page */
        .description-compact {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            line-height: 1.4;
            color: #555;
            margin-bottom: 25px;
            font-size: 14px;
            max-height: 80px;
            overflow: hidden;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }

        .items-table thead {
            background-color: #01303f;
            color: white;
        }

        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
            border-top: none;
            /* For tables and important text, use slightly heavier font weights */
            font-weight: 500; /* Instead of normal (400) */
            letter-spacing: 0.01em; /* Tiny spacing for clarity */
        }

        .items-table thead th {
            border-top: 1px solid #ddd;
        }

        .items-table th {
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 13px;
        }

        .items-table tbody tr:hover {
            background-color: #f8f9fa;
        }

        .item-number {
            text-align: center;
            font-weight: bold;
            color: #666;
        }

        .item-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 3px;
        }

        .item-description {
            color: #666;
            /* For very small text, use slightly larger sizes */
            font-size: 12px; /* Instead of 11px */
            line-height: 1.3;
        }

        .item-price {
            text-align: right;
            font-weight: bold;
            color: #01303f;
        }

        .total-row {
            background-color: #f8f9fa;
            font-size: 16px;
        }

        .total-row td {
            border-top: 2px solid #01303f;
            font-weight: bold;
        }

        /* Page Breaks */
        .page-break {
            page-break-before: always;
            margin-top: 40px;
        }

        .page-break-after {
            page-break-after: always;
        }

        /* Second Page Styles */
        .second-page {
            padding-top: 40px;
        }

        .second-page-header {
            background-color: #01303f;
            color: white;
            padding: 20px 40px;
            margin: -40px -40px 40px -40px;
            text-align: center;
        }

        .second-page-title {
            font-size: 24px;
            font-weight: bold;
        }

        /* Payment Summary */
        .payment-summary {
            background: linear-gradient(135deg, #01303f 0%, #1a4a5c 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(1, 48, 63, 0.3);
            /* Ensure pixel-perfect positioning */
            position: relative;
            top: 0;
            left: 0;
        }

        .payment-summary .section-title {
            color: white;
            margin-bottom: 20px;
            text-align: center;
        }

        .payment-grid {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin: 20px 0;
        }

        .payment-item {
            text-align: center;
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }

        .payment-item .label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
            min-width: auto;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .payment-item .value {
            font-size: 20px;
            font-weight: bold;
            color: white;
        }

        .amount-paid .value {
            color: #4ade80;
        }

        .balance-due .value {
            color: #f87171;
        }

        /* Payment History Table */
        .payment-history-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .payment-history-table thead {
            background-color: #01303f;
            color: white;
        }

        .payment-history-table th,
        .payment-history-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .payment-history-table tbody tr:hover {
            background-color: #f8f9fa;
        }

        .no-payments {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 30px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #ddd;
        }

        /* Full Description on Second Page */
        .description-full {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            line-height: 1.6;
            color: #555;
            margin: 20px 0;
            border-left: 4px solid #01303f;
        }

        /* Terms and Conditions Styling */
        .terms-section {
            background-color: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .conditions-section {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        /* Content Separation */
        .section-separator {
            margin: 30px 0;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
        }

        /* Signature Section */
        .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 40px;
            padding-top: 30px;
            padding-bottom: 40px;
            border-top: 2px solid #e5e7eb;
            min-height: 200px;
        }

        .signature-left,
        .signature-right {
            flex: 1;
            text-align: center;
            padding: 0 20px;
        }

        .signature-name {
            font-size: 18px;
            font-weight: bold;
            color: #01303f;
            margin-bottom: 5px;
        }

        .signature-title {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .signature-image {
            margin-top: 10px;
            text-align: center;
        }

        .signature-image img {
            max-width: 250px;
            height: auto;
            display: block;
            margin: 0 auto;
            object-fit: contain;
        }

        .signature-line {
            width: 200px;
            height: 2px;
            background-color: #333;
            margin: 20px auto 0;
            border-radius: 1px;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .invoice-header {
                flex-direction: column;
                text-align: center;
                padding: 30px 20px;
            }

            .header-left {
                flex-direction: column;
                margin-bottom: 20px;
            }

            .invoice-title {
                margin-left: 0;
                font-size: 36px;
            }

            .invoice-content {
                padding: 20px;
            }

            .invoice-details-section {
                flex-direction: column;
                gap: 20px;
            }

            .payment-grid {
                flex-direction: column;
                gap: 15px;
            }

            .items-table,
            .payment-history-table {
                font-size: 13px;
            }

            .items-table th,
            .items-table td,
            .payment-history-table th,
            .payment-history-table td {
                padding: 8px 6px;
            }

            .second-page-header {
                margin: -20px -20px 30px -20px;
                padding: 15px 20px;
            }

            .signature-section {
                flex-direction: column;
                gap: 30px;
            }

            .signature-line {
                width: 150px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="header-left">
                <div class="logo-container">
                    <!-- Logo with fallback -->
                    <img src="/white-logo-big.png" 
                         alt="Company Logo" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="logo-placeholder">
                        LOGO
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div class="business-name">Invoice</div>
                <div class="business-info">
                    ${branding.company_name || "qwerty"} <br>
                    ${branding.company_address || "Street Address Line 01"}<br>
                    MOF: 4066246<br>
                    ${branding.company_phone || "+1 (999)-999-9999"}<br>
                    ${branding.company_email || "Email Address"}<br>
                    ${branding.company_website || "Website"}
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="invoice-content">
            <div class="invoice-details-section">
                <div class="section-group">
                    <div class="section-title">Invoice Details</div>
                    <div class="info-row">
                        <div class="label">Invoice #</div>
                        <div class="value">${invoice.invoice_number}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Date of Issue</div>
                        <div class="value">${formatDate(
                          invoice.issue_date
                        )}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Due Date</div>
                        <div class="value">${formatDate(invoice.due_date)}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Status</div>
                        <div class="value">
                            <span class="status-badge ${getStatusClass(
                              invoice.status
                            )}">${getStatusText(invoice.status)}</span>
                        </div>
                    </div>
                </div>

                <div class="section-group">
                    <div class="section-title">Bill To</div>
                    <div class="info-row">
                        <div class="label">Customer Name</div>
                        <div class="value">${client.company_name}</div>
                    </div>
                    ${
                      client.contact_person_name
                        ? `
                    <div class="info-row">
                        <div class="label">Contact Person</div>
                        <div class="value">${client.contact_person_name}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      clientAddress
                        ? `
                    <div class="info-row">
                        <div class="label">Address</div>
                        <div class="value">${clientAddress}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      client.company_email
                        ? `
                    <div class="info-row">
                        <div class="label">Email</div>
                        <div class="value">${client.company_email}</div>
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
                      client.mof_number
                        ? `
                    <div class="info-row">
                        <div class="label">MOF Number</div>
                        <div class="value">${client.mof_number}</div>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>

            ${
              invoice.description
                ? `
            <!-- Compact Description for First Page -->
            <div class="description-compact">
                <strong>Description:</strong> ${invoice.description.substring(
                  0,
                  150
                )}${invoice.description.length > 150 ? "..." : ""}
            </div>
            `
                : ""
            }

            <!-- Items Table -->
            <div class="section-title">Items & Services</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">#</th>
                        <th>Item/Service</th>
                        <th>Note</th>
                        <th style="text-align: center; width: 80px;">Qty</th>
                        <th style="text-align: right; width: 110px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f8f9fa;">
                        <td colspan="4" style="text-align: right;">Subtotal:</td>
                        <td class="item-price">${formatCurrency(
                          invoice.total_amount
                        )}</td>
                    </tr>
                    ${
                      invoice.discount && invoice.discount > 0
                        ? `
                    <tr style="background-color: #f8f9fa;">
                        <td colspan="4" style="text-align: right;">Discount:</td>
                        <td class="item-price">-${formatCurrency(
                          invoice.discount
                        )}</td>
                    </tr>
                    `
                        : ""
                    }
                    ${
                      invoice.tax && invoice.tax > 0
                        ? `
                    <tr style="background-color: #f8f9fa;">
                        <td colspan="4" style="text-align: right;">Tax:</td>
                        <td class="item-price">${formatCurrency(
                          invoice.tax
                        )}</td>
                    </tr>
                    `
                        : ""
                    }
                    <tr class="total-row">
                        <td colspan="4" style="text-align: right; font-weight: bold; font-size: 18px;">TOTAL:</td>
                        <td class="item-price" style="font-weight: bold; font-size: 18px;">${formatCurrency(
                          invoice.total_amount
                        )}</td>
                    </tr>
                </tfoot>
            </table>

            <br><br><br><br><br><br><br><br><br><br><br><br>
            
            <!-- PAGE BREAK: Second page starts here -->
            <div class="second-page">

                <!-- Payment Summary -->
                <div class="payment-summary">
                    <div class="section-title">Payment Summary</div>
                    <div class="payment-grid">
                        <div class="payment-item">
                            <div class="label">Total Amount</div>
                            <div class="value">${formatCurrency(
                              invoice.total_amount
                            )}</div>
                        </div>
                        <div class="payment-item amount-paid">
                            <div class="label">Amount Paid</div>
                            <div class="value">${formatCurrency(
                              invoice.amount_paid || 0
                            )}</div>
                        </div>
                        <div class="payment-item balance-due">
                            <div class="label">Balance Due</div>
                            <div class="value">${formatCurrency(
                              invoice.balance_due || 0
                            )}</div>
                        </div>
                    </div>
                </div>

                <div class="section-separator"></div>

                <!-- Payment History -->
                <div class="section-title">Payment History</div>
                ${paymentHistory}

                <div class="section-separator"></div>


                <div class="section-separator"></div>

                <!-- Conditions/Instructions -->
                <div class="section-title">Conditions/Instructions</div>
                <div class="conditions-section">
                    Please include the invoice number with your payment. We accept bank transfers, OMT and Whish.
                </div>

                <div class="section-separator"></div>

                <!-- Signature Section -->
                <div class="signature-section">
                    <div class="signature-left">
                        <div class="signature-name">Karim Zahlan</div>
                        <div class="signature-title">Co-Founder</div>
                        <div class="signature-image">
                            <img src="/signature.png" alt="Signature">
                        </div>
                    </div>
                    <div class="signature-right">
                        <div class="signature-name">${client.company_name}</div>
                        <div class="signature-title">Client Signature</div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

export { generateInvoicePDFWithBranding };
