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
    company_name: string;
    company_email?: string;
    contact_person_name?: string;
    contact_person_email?: string;
    contact_phone?: string;
    address?: string;
    mof_number?: string;
    notes?: string;
    description: string;
    terms_and_conditions?: string;
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
    company_name: string;
    company_email?: string;
    contact_person_name?: string;
    contact_person_email?: string;
    contact_phone?: string;
    address?: string;
    mof_number?: string;
    notes?: string;
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

export interface ReceiptPDFData {
  success: boolean;
  pdfHtml: string;
  receipt: {
    id: string;
    receipt_number: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    created_at: string;
  };
  client: {
    id: string;
    company_name: string;
    company_email?: string;
    contact_person_name?: string;
    contact_person_email?: string;
    contact_phone?: string;
    address?: string;
    mof_number?: string;
    notes?: string;
  };
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    status: string;
    issue_date: string;
    due_date: string;
    description?: string;
  };
}

export interface PDFGenerationError {
  success: false;
  error: string;
}
