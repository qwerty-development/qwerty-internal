import puppeteer from "puppeteer";

// Generate invoice PDF as buffer for email attachment
export async function generateInvoicePDFBuffer(
  invoiceHtml: string
): Promise<Buffer> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(invoiceHtml, { waitUntil: "networkidle0" });

    // Set viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1123 }); // A4 size

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
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
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(receiptHtml, { waitUntil: "networkidle0" });

    // Set viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1123 }); // A4 size

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating receipt PDF buffer:", error);
    throw error;
  }
}
