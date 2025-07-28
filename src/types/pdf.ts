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

export interface PDFGenerationError {
  success: false;
  error: string;
}
