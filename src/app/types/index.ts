export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  regularBalance: number;
  paidAmount: number;
}

export interface InvoiceItem {
  id?: string;
  position: number;
  title: string;
  description?: string;
  price: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  description: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: "Unpaid" | "Partially Paid" | "Paid";
  usesItems?: boolean;
  items?: InvoiceItem[];
}

export interface QuotationItem {
  id?: string;
  position: number;
  title: string;
  description?: string;
  price: number;
}

export interface Quotation {
  id: string;
  clientId?: string;
  quotationNumber: string;
  issueDate: string;
  dueDate?: string;
  description: string;
  totalAmount: number;
  status: "Draft" | "Sent" | "Approved" | "Rejected" | "Converted";

  // Client data fields
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientContactEmail?: string;
  clientContactPhone?: string;
  clientAddress?: string;
  clientNotes?: string;

  // Quotation-specific fields
  quotationIssueDate: string;
  quotationDueDate?: string;
  approvedAt?: string;
  rejectedAt?: string;
  convertedToInvoiceId?: string;
  isConverted?: boolean;
  usesItems?: boolean;
  items?: QuotationItem[];

  // Metadata
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  clientId: string;
  invoiceId: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
}
