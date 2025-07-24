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

export interface Receipt {
  id: string;
  clientId: string;
  invoiceId: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
}
