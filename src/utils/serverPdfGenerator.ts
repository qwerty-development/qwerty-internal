// Generate invoice PDF as buffer for email attachment
export async function generateInvoicePDFBuffer(
  invoiceHtml: string
): Promise<Buffer> {
  try {
    const { jsPDF } = await import("jspdf");

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Extract data from HTML
    const invoiceData = extractInvoiceDataFromHTML(invoiceHtml);

    // Add header
    pdf.setFillColor(1, 48, 63); // Dark blue background
    pdf.rect(0, 0, 210, 40, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE", 20, 25);

    // Company info
    pdf.setFontSize(12);
    pdf.text(invoiceData.companyName || "Your Company", 120, 20);
    pdf.text(invoiceData.companyAddress || "", 120, 27);
    pdf.text(invoiceData.companyEmail || "", 120, 34);

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    let yPosition = 50;

    // Invoice details
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Details", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Date: ${invoiceData.issueDate}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Due Date: ${invoiceData.dueDate}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Status: ${invoiceData.status}`, 20, yPosition);
    yPosition += 15;

    // Client details
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Bill To", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoiceData.clientName, 20, yPosition);
    yPosition += 6;
    if (invoiceData.clientAddress) {
      pdf.text(invoiceData.clientAddress, 20, yPosition);
      yPosition += 6;
    }
    if (invoiceData.clientEmail) {
      pdf.text(invoiceData.clientEmail, 20, yPosition);
      yPosition += 6;
    }
    if (invoiceData.clientMofNumber) {
      pdf.text(`MOF: ${invoiceData.clientMofNumber}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 9;

    // Items table
    if (invoiceData.items && invoiceData.items.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Items", 20, yPosition);
      yPosition += 10;

      // Table header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPosition - 5, 170, 8, "F");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Item", 25, yPosition);
      pdf.text("Description", 80, yPosition);
      pdf.text("Qty", 140, yPosition);
      pdf.text("Price", 160, yPosition);

      yPosition += 8;

      // Table rows
      pdf.setFont("helvetica", "normal");
      for (const item of invoiceData.items) {
        pdf.text(item.title || "Item", 25, yPosition);
        pdf.text(item.description || "", 80, yPosition);
        pdf.text("1", 140, yPosition);
        pdf.text(item.price || "", 160, yPosition);
        yPosition += 6;

        // Add new page if needed
        if (yPosition >= 250) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }

    // Total
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total: ${invoiceData.totalAmount}`, 140, yPosition);

    return Buffer.from(pdf.output("arraybuffer"));
  } catch (error) {
    console.error("Error generating invoice PDF buffer:", error);
    throw error;
  }
}

// Generate receipt PDF as buffer for email attachment
export async function generateReceiptPDFBuffer(
  receiptHtml: string
): Promise<Buffer> {
  try {
    const { jsPDF } = await import("jspdf");

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Extract data from HTML
    const receiptData = extractReceiptDataFromHTML(receiptHtml);

    // Add header
    pdf.setFillColor(1, 48, 63); // Dark blue background
    pdf.rect(0, 0, 210, 40, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("RECEIPT", 20, 25);

    // Company info
    pdf.setFontSize(12);
    pdf.text(receiptData.companyName || "Your Company", 120, 20);
    pdf.text(receiptData.companyAddress || "", 120, 27);
    pdf.text(receiptData.companyEmail || "", 120, 34);

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    let yPosition = 50;

    // Receipt details
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Receipt Details", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Receipt #: ${receiptData.receiptNumber}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Date: ${receiptData.paymentDate}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Payment Method: ${receiptData.paymentMethod}`, 20, yPosition);
    yPosition += 15;

    // Client details
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Paid By", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(receiptData.clientName, 20, yPosition);
    yPosition += 6;
    if (receiptData.clientAddress) {
      pdf.text(receiptData.clientAddress, 20, yPosition);
      yPosition += 6;
    }
    if (receiptData.clientEmail) {
      pdf.text(receiptData.clientEmail, 20, yPosition);
      yPosition += 15;
    }

    // Amount
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Amount Paid: ${receiptData.amount}`, 20, yPosition);

    return Buffer.from(pdf.output("arraybuffer"));
  } catch (error) {
    console.error("Error generating receipt PDF buffer:", error);
    throw error;
  }
}

// Helper function to extract invoice data from HTML
function extractInvoiceDataFromHTML(html: string): any {
  const data: any = {};

  // Extract invoice number
  const invoiceNumberMatch = html.match(/Invoice #:\s*([^<]+)/i);
  if (invoiceNumberMatch) {
    data.invoiceNumber = invoiceNumberMatch[1].trim();
  }

  // Extract dates
  const dateMatch = html.match(/Date:\s*([^<]+)/i);
  if (dateMatch) {
    data.issueDate = dateMatch[1].trim();
  }

  const dueDateMatch = html.match(/Due Date:\s*([^<]+)/i);
  if (dueDateMatch) {
    data.dueDate = dueDateMatch[1].trim();
  }

  // Extract status
  const statusMatch = html.match(/Status:\s*([^<]+)/i);
  if (statusMatch) {
    data.status = statusMatch[1].trim();
  }

  // Extract total amount
  const totalMatch = html.match(/Total:\s*\$?([0-9,]+\.?[0-9]*)/i);
  if (totalMatch) {
    data.totalAmount = `$${totalMatch[1]}`;
  }

  // Extract client name
  const clientNameMatch = html.match(/Bill To[^>]*>([^<]+)/i);
  if (clientNameMatch) {
    data.clientName = clientNameMatch[1].trim();
  }

  // Extract company name
  const companyNameMatch = html.match(/class="business-name"[^>]*>([^<]+)/i);
  if (companyNameMatch) {
    data.companyName = companyNameMatch[1].trim();
  }

  // Extract client MOF number
  const mofMatch = html.match(/MOF Number<\/div>\s*<div[^>]*>([^<]+)/i);
  if (mofMatch) {
    data.clientMofNumber = mofMatch[1].trim();
  }

  // Extract items (basic extraction)
  const items: any[] = [];
  const itemMatches = html.match(/class="item-title"[^>]*>([^<]+)/gi);
  const priceMatches = html.match(/class="item-price"[^>]*>([^<]+)/gi);

  if (itemMatches && priceMatches) {
    for (
      let i = 0;
      i < Math.min(itemMatches.length, priceMatches.length);
      i++
    ) {
      const title = itemMatches[i]
        .replace(/class="item-title"[^>]*>/, "")
        .replace(/<\/[^>]*>/, "")
        .trim();
      const price = priceMatches[i]
        .replace(/class="item-price"[^>]*>/, "")
        .replace(/<\/[^>]*>/, "")
        .trim();
      items.push({ title, price });
    }
  }

  data.items = items;

  return data;
}

// Helper function to extract receipt data from HTML
function extractReceiptDataFromHTML(html: string): any {
  const data: any = {};

  // Extract receipt number
  const receiptNumberMatch = html.match(/Receipt #:\s*([^<]+)/i);
  if (receiptNumberMatch) {
    data.receiptNumber = receiptNumberMatch[1].trim();
  }

  // Extract payment date
  const dateMatch = html.match(/Payment Date:\s*([^<]+)/i);
  if (dateMatch) {
    data.paymentDate = dateMatch[1].trim();
  }

  // Extract payment method
  const methodMatch = html.match(/Payment Method:\s*([^<]+)/i);
  if (methodMatch) {
    data.paymentMethod = methodMatch[1].trim();
  }

  // Extract amount
  const amountMatch = html.match(/Amount:\s*\$?([0-9,]+\.?[0-9]*)/i);
  if (amountMatch) {
    data.amount = `$${amountMatch[1]}`;
  }

  // Extract client name
  const clientNameMatch = html.match(/Paid By[^>]*>([^<]+)/i);
  if (clientNameMatch) {
    data.clientName = clientNameMatch[1].trim();
  }

  // Extract company name
  const companyNameMatch = html.match(/class="business-name"[^>]*>([^<]+)/i);
  if (companyNameMatch) {
    data.companyName = companyNameMatch[1].trim();
  }

  return data;
}
