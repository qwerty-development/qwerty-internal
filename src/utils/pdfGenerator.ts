import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  QuotationPDFData,
  PDFGenerationError,
  InvoicePDFData,
  ReceiptPDFData,
} from "@/types/pdf";

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
    tempDiv.style.width = "800px"; // Set a fixed width for consistent rendering
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "20px";
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 800,
      height: tempDiv.scrollHeight,
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    // Calculate dimensions to fit the content properly
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // Leave 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

    // If content is longer than one page, add new pages
    if (imgHeight > pdfHeight - 20) {
      const pagesNeeded = Math.ceil(imgHeight / (pdfHeight - 20));
      for (let i = 1; i < pagesNeeded; i++) {
        pdf.addPage();
        const yOffset = -(i * (pdfHeight - 20)) + 10;
        pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
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

export async function generateInvoicePDF(invoiceId: string): Promise<void> {
  try {
    // Fetch the PDF data from the API
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
    const data: InvoicePDFData | PDFGenerationError = await response.json();

    if (!data.success) {
      // Type guard to ensure we have an error object
      const errorData = data as PDFGenerationError;
      throw new Error(errorData.error || "Failed to generate PDF");
    }

    // Create a temporary div to render the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data.pdfHtml;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "800px"; // Set a fixed width for consistent rendering
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "20px";
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 800,
      height: tempDiv.scrollHeight,
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    // Calculate dimensions to fit the content properly
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // Leave 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

    // If content is longer than one page, add new pages
    if (imgHeight > pdfHeight - 20) {
      const pagesNeeded = Math.ceil(imgHeight / (pdfHeight - 20));
      for (let i = 1; i < pagesNeeded; i++) {
        pdf.addPage();
        const yOffset = -(i * (pdfHeight - 20)) + 10;
        pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
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
    tempDiv.style.width = "800px"; // Set a fixed width for consistent rendering
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "20px";
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 800,
      height: tempDiv.scrollHeight,
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    // Calculate dimensions to fit the content properly
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // Leave 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

    // If content is longer than one page, add new pages
    if (imgHeight > pdfHeight - 20) {
      const pagesNeeded = Math.ceil(imgHeight / (pdfHeight - 20));
      for (let i = 1; i < pagesNeeded; i++) {
        pdf.addPage();
        const yOffset = -(i * (pdfHeight - 20)) + 10;
        pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
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

export async function generateQuotationPDFFromHTML(
  htmlContent: string,
  fileName: string
): Promise<void> {
  try {
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "800px";
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.padding = "20px";
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 800,
      height: tempDiv.scrollHeight,
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

    // Handle multiple pages if needed
    if (imgHeight > pdfHeight - 20) {
      const pagesNeeded = Math.ceil(imgHeight / (pdfHeight - 20));
      for (let i = 1; i < pagesNeeded; i++) {
        pdf.addPage();
        const yOffset = -(i * (pdfHeight - 20)) + 10;
        pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
      }
    }

    // Save the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF from HTML:", error);
    throw error;
  }
}
