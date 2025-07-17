export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  regularBalance: number;
  paidAmount: number;
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
