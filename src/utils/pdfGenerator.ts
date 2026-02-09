import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  QuotationPDFData,
  PDFGenerationError,
  InvoicePDFData,
  ReceiptPDFData,
} from "@/types/pdf";

export async function generateInvoicePDF(invoiceId: string): Promise<void> {
  try {
    // Fetch the PDF data from the API
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
    const data: InvoicePDFData | PDFGenerationError = await response.json();

    if (!data.success) {
      const errorData = data as PDFGenerationError;
      throw new Error(errorData.error || "Failed to generate PDF");
    }

    // Create a temporary div to render the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data.pdfHtml;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "210mm"; // A4 width
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "0"; // Remove padding to avoid size issues
    document.body.appendChild(tempDiv);

    // Wait for fonts and images to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // BALANCED: Good quality with reasonable file size
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5, // Increased for better quality - sweet spot between 1.2-1.8
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794, // A4 width in pixels at 96 DPI
      height: tempDiv.scrollHeight,
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
      // Better quality settings
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        // Optimize images in the cloned document
        const images = clonedDoc.querySelectorAll("img");
        images.forEach((img) => {
          img.style.maxWidth = "100%";
          img.style.height = "auto";
        });

        // Improve text rendering
        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            (el.style as any).webkitFontSmoothing = "antialiased";
            (el.style as any).mozOsxFontSmoothing = "grayscale";
          }
        });
      },
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF with compression
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true, // Enable compression
      precision: 2,
    });

    // BALANCED: Use JPEG with higher quality for crisp text
    const imgData = canvas.toDataURL("image/jpeg", 0.92); // 92% quality for sharp text

    // Calculate dimensions to fit A4 properly
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 10; // 5mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // OPTIMIZED: Better page handling - crop image per page instead of duplicating
    if (imgHeight <= pdfHeight - 10) {
      // Single page
      pdf.addImage(imgData, "JPEG", 5, 5, imgWidth, imgHeight);
    } else {
      // Multiple pages - crop the canvas for each page
      const pageHeight = pdfHeight - 10;
      const pagesNeeded = Math.ceil(imgHeight / pageHeight);

      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) pdf.addPage();

        // Calculate the portion of the image for this page
        const srcY = (i * pageHeight * canvas.width) / imgWidth;
        const srcHeight = Math.min(
          (pageHeight * canvas.width) / imgWidth,
          canvas.height - srcY
        );

        // Create a smaller canvas for this page section
        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcHeight;

        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            srcHeight,
            0,
            0,
            canvas.width,
            srcHeight
          );

          const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.8);
          const pageImgHeight = (srcHeight * imgWidth) / canvas.width;

          pdf.addImage(pageImgData, "JPEG", 5, 5, imgWidth, pageImgHeight);
        }
      }
    }

    // Save the PDF
    const fileName = `invoice-${data.invoice.invoice_number}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

// ALTERNATIVE: Even more optimized version using smaller dimensions
export async function generateInvoicePDFCompact(
  invoiceId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
    const data: InvoicePDFData | PDFGenerationError = await response.json();

    if (!data.success) {
      const errorData = data as PDFGenerationError;
      throw new Error(errorData.error || "Failed to generate PDF");
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data.pdfHtml;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "595px"; // A4 width at 72 DPI
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "0";
    tempDiv.style.fontSize = "12px"; // Smaller font for compact layout
    document.body.appendChild(tempDiv);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // ULTRA OPTIMIZED: Very low scale and smaller dimensions
    const canvas = await html2canvas(tempDiv, {
      scale: 0.5, // Very low scale
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 595,
      height: tempDiv.scrollHeight,
      logging: false,
      removeContainer: true,
      foreignObjectRendering: false,
    });

    document.body.removeChild(tempDiv);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
      precision: 1, // Lower precision
    });

    // Use JPEG with lower quality for maximum compression
    const imgData = canvas.toDataURL("image/jpeg", 0.6); // 60% quality

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 40; // 20pt margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pdfHeight - 40) {
      pdf.addImage(imgData, "JPEG", 20, 20, imgWidth, imgHeight);
    } else {
      // Handle multiple pages with cropping
      const pageHeight = pdfHeight - 40;
      const pagesNeeded = Math.ceil(imgHeight / pageHeight);

      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) pdf.addPage();

        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");
        const srcY = (i * pageHeight * canvas.width) / imgWidth;
        const srcHeight = Math.min(
          (pageHeight * canvas.width) / imgWidth,
          canvas.height - srcY
        );

        pageCanvas.width = canvas.width;
        pageCanvas.height = srcHeight;

        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            srcHeight,
            0,
            0,
            canvas.width,
            srcHeight
          );

          const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.6);
          const pageImgHeight = (srcHeight * imgWidth) / canvas.width;

          pdf.addImage(pageImgData, "JPEG", 20, 20, imgWidth, pageImgHeight);
        }
      }
    }

    const fileName = `invoice-${data.invoice.invoice_number}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

// BEST APPROACH: Native PDF generation without html2canvas
export async function generateInvoicePDFNative(
  invoiceId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
    const data: InvoicePDFData | PDFGenerationError = await response.json();

    if (!data.success) {
      const errorData = data as PDFGenerationError;
      throw new Error(errorData.error || "Failed to generate PDF");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const { invoice, client, items, receipts } = data;

    // Native PDF generation - much smaller file size!
    let yPosition = 20;

    // Header
    pdf.setFillColor(1, 48, 63);
    pdf.rect(0, 0, 210, 50, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("INVOICE", 20, 30);

    // Company info
    pdf.setFontSize(12);
    pdf.text("Your Company Name", 120, 25);
    pdf.text("123 Business Street", 120, 32);
    pdf.text("City, State 12345", 120, 39);

    yPosition = 60;
    pdf.setTextColor(0, 0, 0);

    // Invoice details
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Details", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Invoice #: ${invoice.invoice_number}`, 20, yPosition);
    yPosition += 6;
    pdf.text(
      `Date: ${new Date(invoice.issue_date).toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 6;
    pdf.text(
      `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 15;

    // Client details
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Bill To", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(client.company_name, 20, yPosition);
    yPosition += 6;
    if (client.contact_person_name) {
      pdf.text(client.contact_person_name, 20, yPosition);
      yPosition += 6;
    }
    if (client.mof_number) {
      pdf.text(`MOF: ${client.mof_number}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 15;

    // Items table
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Items & Services", 20, yPosition);
    yPosition += 10;

    // Table headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPosition - 5, 170, 8, "F");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("#", 25, yPosition);
    pdf.text("Description", 40, yPosition);
    pdf.text("Qty", 140, yPosition);
    pdf.text("Amount", 160, yPosition);
    yPosition += 10;

    // Table rows
    pdf.setFont("helvetica", "normal");
    if (items.length > 0) {
      items.forEach((item, index) => {
        pdf.text((index + 1).toString(), 25, yPosition);
        pdf.text(item.title, 40, yPosition);
        pdf.text("1", 140, yPosition);
        pdf.text(`$${item.price.toFixed(2)}`, 160, yPosition);
        yPosition += 8;
      });
    } else {
      pdf.text("1", 25, yPosition);
      pdf.text("Invoice Item", 40, yPosition);
      pdf.text("1", 140, yPosition);
      pdf.text(`$${invoice.total_amount.toFixed(2)}`, 160, yPosition);
      yPosition += 8;
    }

    // Total
    yPosition += 5;
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 8;

    pdf.setFont("helvetica", "bold");
    pdf.text("TOTAL:", 140, yPosition);
    pdf.text(`$${invoice.total_amount.toFixed(2)}`, 160, yPosition);

    const fileName = `invoice-${invoice.invoice_number}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating native PDF:", error);
    throw error;
  }
}

// Updated functions for other document types with same optimizations
export async function generateQuotationPDF(quotationId: string): Promise<void> {
  try {
    // Fetch the PDF data from the API
    const response = await fetch(`/api/quotations/${quotationId}/pdf`);
    const data: QuotationPDFData | PDFGenerationError = await response.json();

    if (!data.success) {
      const errorData = data as PDFGenerationError;
      throw new Error(errorData.error || "Failed to generate PDF");
    }

    // Create a temporary div to render the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data.pdfHtml;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "210mm"; // A4 width
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "0";
    document.body.appendChild(tempDiv);

    // Wait for fonts and images to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // HIGH QUALITY: Better clarity, full width
    const canvas = await html2canvas(tempDiv, {
      scale: 1.8, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      height: tempDiv.scrollHeight,
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        const images = clonedDoc.querySelectorAll("img");
        images.forEach((img) => {
          img.style.maxWidth = "100%";
          img.style.height = "auto";
        });

        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            (el.style as any).webkitFontSmoothing = "antialiased";
            (el.style as any).mozOsxFontSmoothing = "grayscale";
            el.style.textRendering = "optimizeLegibility";
          }
        });
      },
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Trim any white space at the top of the canvas to eliminate visible top gap
    const findTopContentY = (sourceCanvas: HTMLCanvasElement): number => {
      const context = sourceCanvas.getContext("2d");
      if (!context) return 0;
      const { width, height } = sourceCanvas;
      const whiteThreshold = 250; // treat anything close to white as empty
      const sampleStride = Math.max(1, Math.floor(width / 400)); // subsample wide rows for speed
      for (let y = 0; y < height; y++) {
        const row = context.getImageData(0, y, width, 1).data;
        let rowEmpty = true;
        for (let x = 0; x < width; x += sampleStride) {
          const i = x * 4;
          const r = row[i];
          const g = row[i + 1];
          const b = row[i + 2];
          const a = row[i + 3];
          // Consider non-transparent and not almost white as content
          if (
            a > 5 &&
            (r < whiteThreshold || g < whiteThreshold || b < whiteThreshold)
          ) {
            rowEmpty = false;
            break;
          }
        }
        if (!rowEmpty) return y;
      }
      return 0;
    };

    // Preserve a ~6mm margin at the top (at 96 DPI A4 width 794px, mm per px ~ 210mm/794px)
    const mmPerPx = 210 / 794; // ~0.2647 mm/px
    const desiredTopMarginMm = 6;
    const desiredTopMarginPx = Math.round(desiredTopMarginMm / mmPerPx);
    const topCropRaw = findTopContentY(canvas);
    const topCrop = Math.max(0, topCropRaw - desiredTopMarginPx);
    const workingCanvas =
      topCrop > 0
        ? (() => {
            const c = document.createElement("canvas");
            c.width = canvas.width;
            c.height = Math.max(1, canvas.height - topCrop);
            const ctx = c.getContext("2d");
            if (ctx) {
              ctx.drawImage(
                canvas,
                0,
                topCrop,
                canvas.width,
                canvas.height - topCrop,
                0,
                0,
                canvas.width,
                canvas.height - topCrop
              );
            }
            return c;
          })()
        : canvas;

    // Create PDF with compression
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      precision: 3,
    });

    const imgData = workingCanvas.toDataURL("image/jpeg", 0.95);

    // Calculate dimensions for FULL WIDTH
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth; // FULL WIDTH
    const imgHeight = (workingCanvas.height * imgWidth) / workingCanvas.width;

    // Add image to PDF - full width
    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      const pageHeight = pdfHeight;
      const pagesNeeded = Math.ceil(imgHeight / pageHeight);

      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) pdf.addPage();

        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");
        const srcY = (i * pageHeight * workingCanvas.width) / imgWidth;
        const srcHeight = Math.min(
          (pageHeight * workingCanvas.width) / imgWidth,
          workingCanvas.height - srcY
        );

        pageCanvas.width = workingCanvas.width;
        pageCanvas.height = srcHeight;

        if (pageCtx) {
          pageCtx.imageSmoothingEnabled = true;
          pageCtx.imageSmoothingQuality = "high";

          pageCtx.drawImage(
            workingCanvas,
            0,
            srcY,
            workingCanvas.width,
            srcHeight,
            0,
            0,
            workingCanvas.width,
            srcHeight
          );

          const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
          const pageImgHeight = (srcHeight * imgWidth) / workingCanvas.width;

          pdf.addImage(pageImgData, "JPEG", 0, 0, imgWidth, pageImgHeight);
        }
      }
    }

    // Save the PDF
    const fileName = `quotation-${data.quotation.quotation_number}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

export async function generateReceiptPDF(receiptId: string): Promise<void> {
  try {
    // Fetch the PDF data from the API
    const response = await fetch(`/api/receipts/${receiptId}/pdf`);
    const data: ReceiptPDFData | PDFGenerationError = await response.json();

    if (!data.success) {
      const errorData = data as PDFGenerationError;
      throw new Error(errorData.error || "Failed to generate PDF");
    }

    // Create a temporary div to render the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data.pdfHtml;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "210mm"; // A4 width
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "0";
    document.body.appendChild(tempDiv);

    // Wait for fonts and images to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // HIGH QUALITY: Better clarity, full width
    const canvas = await html2canvas(tempDiv, {
      scale: 1.8, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      height: tempDiv.scrollHeight,
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        const images = clonedDoc.querySelectorAll("img");
        images.forEach((img) => {
          img.style.maxWidth = "100%";
          img.style.height = "auto";
        });

        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            (el.style as any).webkitFontSmoothing = "antialiased";
            (el.style as any).mozOsxFontSmoothing = "grayscale";
            el.style.textRendering = "optimizeLegibility";
          }
        });
      },
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Trim any white space at the top of the canvas to eliminate visible top gap
    const findTopContentY = (sourceCanvas: HTMLCanvasElement): number => {
      const context = sourceCanvas.getContext("2d");
      if (!context) return 0;
      const { width, height } = sourceCanvas;
      const whiteThreshold = 250; // treat anything close to white as empty
      const sampleStride = Math.max(1, Math.floor(width / 400));
      for (let y = 0; y < height; y++) {
        const row = context.getImageData(0, y, width, 1).data;
        let rowEmpty = true;
        for (let x = 0; x < width; x += sampleStride) {
          const i = x * 4;
          const r = row[i];
          const g = row[i + 1];
          const b = row[i + 2];
          const a = row[i + 3];
          if (
            a > 5 &&
            (r < whiteThreshold || g < whiteThreshold || b < whiteThreshold)
          ) {
            rowEmpty = false;
            break;
          }
        }
        if (!rowEmpty) return y;
      }
      return 0;
    };

    // Preserve a ~6mm margin at the top (A4 width 210mm → 794px)
    const mmPerPx = 210 / 794;
    const desiredTopMarginMm = 6;
    const desiredTopMarginPx = Math.round(desiredTopMarginMm / mmPerPx);
    const topCropRaw = findTopContentY(canvas);
    const topCrop = Math.max(0, topCropRaw - desiredTopMarginPx);
    const workingCanvas =
      topCrop > 0
        ? (() => {
            const c = document.createElement("canvas");
            c.width = canvas.width;
            c.height = Math.max(1, canvas.height - topCrop);
            const ctx = c.getContext("2d");
            if (ctx) {
              ctx.drawImage(
                canvas,
                0,
                topCrop,
                canvas.width,
                canvas.height - topCrop,
                0,
                0,
                canvas.width,
                canvas.height - topCrop
              );
            }
            return c;
          })()
        : canvas;

    // Create PDF with compression
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      precision: 3,
    });

    const imgData = workingCanvas.toDataURL("image/jpeg", 0.95);

    // Calculate dimensions for FULL WIDTH
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth; // FULL WIDTH
    const imgHeight = (workingCanvas.height * imgWidth) / workingCanvas.width;

    // Add image to PDF - full width
    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      const pageHeight = pdfHeight;
      const pagesNeeded = Math.ceil(imgHeight / pageHeight);

      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) pdf.addPage();

        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");
        const srcY = (i * pageHeight * workingCanvas.width) / imgWidth;
        const srcHeight = Math.min(
          (pageHeight * workingCanvas.width) / imgWidth,
          workingCanvas.height - srcY
        );

        pageCanvas.width = workingCanvas.width;
        pageCanvas.height = srcHeight;

        if (pageCtx) {
          pageCtx.imageSmoothingEnabled = true;
          pageCtx.imageSmoothingQuality = "high";

          pageCtx.drawImage(
            workingCanvas,
            0,
            srcY,
            workingCanvas.width,
            srcHeight,
            0,
            0,
            workingCanvas.width,
            srcHeight
          );

          const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
          const pageImgHeight = (srcHeight * imgWidth) / workingCanvas.width;

          pdf.addImage(pageImgData, "JPEG", 0, 0, imgWidth, pageImgHeight);
        }
      }
    }

    // Save the PDF
    const fileName = `receipt-${data.receipt.receipt_number}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
