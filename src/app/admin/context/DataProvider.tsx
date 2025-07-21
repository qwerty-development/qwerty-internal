"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Client, Invoice, Receipt } from "../../types";

interface DataContextType {
  clients: Client[];
  invoices: Invoice[];
  receipts: Receipt[];
  addClient: (client: Omit<Client, "id">) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  addInvoice: (
    invoice: Omit<
      Invoice,
      "id" | "invoiceNumber" | "amountPaid" | "balanceDue" | "status"
    >
  ) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  addReceipt: (receipt: Omit<Receipt, "id" | "receiptNumber">) => void;
  getClientById: (id: string) => Client | undefined;
  getInvoicesByClientId: (clientId: string) => Invoice[];
  getReceiptsByClientId: (clientId: string) => Receipt[];
  getReceiptsByInvoiceId: (invoiceId: string) => Receipt[];
  getNextInvoiceNumber: () => string;
  getNextReceiptNumber: () => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

const initialClients: Client[] = [
  {
    id: "c1",
    name: "Acme Corp",
    phone: "111-222-3333",
    address: "123 Main St",
    email: "acme@example.com",
    regularBalance: 0,
    paidAmount: 0,
  },
  {
    id: "c2",
    name: "Beta Solutions",
    phone: "444-555-6666",
    address: "456 Oak Ave",
    email: "beta@example.com",
    regularBalance: 0,
    paidAmount: 0,
  },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const addClient = (clientData: Omit<Client, "id">) => {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      regularBalance: 0,
      paidAmount: 0,
    };
    setClients((prev) => [...prev, newClient]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, ...updates } : client
      )
    );
  };

  const addInvoice = (
    invoiceData: Omit<
      Invoice,
      "id" | "invoiceNumber" | "amountPaid" | "balanceDue" | "status"
    >
  ) => {
    const invoiceNumber = getNextInvoiceNumber();
    const newInvoice: Invoice = {
      ...invoiceData,
      id: crypto.randomUUID(),
      invoiceNumber,
      amountPaid: 0,
      balanceDue: invoiceData.totalAmount,
      status: "Unpaid",
    };

    setInvoices((prev) => [...prev, newInvoice]);

    // Update client's regular balance
    setClients((prev) =>
      prev.map((client) =>
        client.id === invoiceData.clientId
          ? {
              ...client,
              regularBalance: client.regularBalance + invoiceData.totalAmount,
            }
          : client
      )
    );
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === id ? { ...invoice, ...updates } : invoice
      )
    );
  };

  const addReceipt = (receiptData: Omit<Receipt, "id" | "receiptNumber">) => {
    const receiptNumber = getNextReceiptNumber();
    const newReceipt: Receipt = {
      ...receiptData,
      id: crypto.randomUUID(),
      receiptNumber,
    };

    setReceipts((prev) => [...prev, newReceipt]);

    // Update invoice
    setInvoices((prev) =>
      prev.map((invoice) => {
        if (invoice.id === receiptData.invoiceId) {
          const newAmountPaid = invoice.amountPaid + receiptData.amount;
          const newBalanceDue = invoice.totalAmount - newAmountPaid;
          const newStatus = newBalanceDue === 0 ? "Paid" : "Partially Paid";

          return {
            ...invoice,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus,
          };
        }
        return invoice;
      })
    );

    // Update client
    setClients((prev) =>
      prev.map((client) =>
        client.id === receiptData.clientId
          ? {
              ...client,
              paidAmount: client.paidAmount + receiptData.amount,
              regularBalance: client.regularBalance - receiptData.amount,
            }
          : client
      )
    );
  };

  const getClientById = (id: string) => {
    return clients.find((client) => client.id === id);
  };

  const getInvoicesByClientId = (clientId: string) => {
    return invoices.filter((invoice) => invoice.clientId === clientId);
  };

  const getReceiptsByClientId = (clientId: string) => {
    return receipts.filter((receipt) => receipt.clientId === clientId);
  };

  const getReceiptsByInvoiceId = (invoiceId: string) => {
    return receipts.filter((receipt) => receipt.invoiceId === invoiceId);
  };

  const getNextInvoiceNumber = () => {
    const nextNumber = invoices.length + 1;
    return `INV-${nextNumber.toString().padStart(3, "0")}`;
  };

  const getNextReceiptNumber = () => {
    const nextNumber = receipts.length + 1;
    return `REC-${nextNumber.toString().padStart(3, "0")}`;
  };

  const value: DataContextType = {
    clients,
    invoices,
    receipts,
    addClient,
    updateClient,
    addInvoice,
    updateInvoice,
    addReceipt,
    getClientById,
    getInvoicesByClientId,
    getReceiptsByClientId,
    getReceiptsByInvoiceId,
    getNextInvoiceNumber,
    getNextReceiptNumber,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
