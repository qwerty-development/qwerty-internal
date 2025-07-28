export interface PDFGenerationOptions {
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

export interface QuotationPDFData {
  success: boolean;
  pdfHtml: string;
  quotation: {
    id: string;
    quotation_number: string;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    client_address?: string;
    description: string;
    total_amount: number;
    issue_date: string;
    due_date?: string;
    status: string;
    uses_items?: boolean;
  };
  items: Array<{
    id: string;
    quotation_id: string;
    position: number;
    title: string;
    description?: string;
    price: number;
  }>;
}

export interface InvoicePDFData {
  success: boolean;
  pdfHtml: string;
  invoice: {
    id: string;
    invoice_number: string;
    client_id: string;
    issue_date: string;
    due_date: string;
    description: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    status: string;
    uses_items?: boolean;
  };
  client: {
    id: string;
    name: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
  };
  items: Array<{
    id: string;
    invoice_id: string;
    position: number;
    title: string;
    description?: string;
    price: number;
  }>;
  receipts: Array<{
    id: string;
    receipt_number: string;
    payment_date: string;
    amount: number;
    payment_method: string;
  }>;
}

export interface PDFGenerationError {
  success: false;
  error: string;
}
