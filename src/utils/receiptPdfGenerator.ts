import { generatePDFTemplate, getBrandingSettings } from "@/utils/brandingService";

export async function generateReceiptPDFWithBranding(
  receipt: any,
  client: any,
  invoice: any
) {
  const branding = await getBrandingSettings();
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
  const receivedByDisplay = branding.company_name
    ? branding.company_name + (receipt.received_by ? ` - ${receipt.received_by}` : "")
    : (receipt.received_by || "");

  const content = `
    <style>
      /* Remove any top gap for receipts; header is suppressed via template */
      @page { size: A4; margin: 0mm 12mm 12mm 12mm; }
      .page-wrap { padding-top: 6mm !important; }
      .header { display: none !important; }
      html, body { margin: 0 !important; padding: 0 !important; }
    </style>
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
          <span class="detail-label">Received By:</span>
          <span class="detail-value">${receivedByDisplay || branding.company_name || "qwerty"}</span>
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

  // Use the centralized branding service with no-header mode
  return await generatePDFTemplate("Receipt_NoHeader", receipt.receipt_number, content);
}
