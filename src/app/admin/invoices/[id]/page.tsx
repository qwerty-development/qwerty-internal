"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "../../context/DataProvider";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { invoices, clients, getReceiptsByInvoiceId, addReceipt } = useData();

  const invoiceId = params.id as string;
  const invoice = invoices.find((inv) => inv.id === invoiceId);
  const client = invoice
    ? clients.find((c) => c.id === invoice.clientId)
    : null;
  const receipts = getReceiptsByInvoiceId(invoiceId);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>(
    {}
  );
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  if (!invoice || !client) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invoice Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The invoice you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/invoices"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const validatePaymentForm = () => {
    const newErrors: Record<string, string> = {};

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    } else if (parseFloat(paymentForm.amount) > invoice.balanceDue) {
      newErrors.amount = `Amount cannot exceed balance due ($${invoice.balanceDue.toFixed(
        2
      )})`;
    }

    if (!paymentForm.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }

    if (!paymentForm.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required";
    }

    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePaymentForm()) {
      return;
    }

    setIsSubmittingPayment(true);

    try {
      addReceipt({
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        paymentDate: paymentForm.paymentDate,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
      });

      // Reset form
      setPaymentForm({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
      });
      setPaymentErrors({});
      setIsSubmittingPayment(false);
    } catch (error) {
      console.error("Error adding payment:", error);
      setIsSubmittingPayment(false);
    }
  };

  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/admin/invoices"
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Invoices
          </Link>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600 mt-2">
              Invoice Details & Payment Management
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/admin/clients/${client.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              View Client
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Invoice Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Invoice Number
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Client
              </label>
              <p className="text-sm text-gray-900 mt-1">{client.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Issue Date
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Due Date
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500">
                Description
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {invoice.description}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Financial Summary
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Total Amount
              </label>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${invoice.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Amount Paid
              </label>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${invoice.amountPaid.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Balance Due
              </label>
              <p
                className={`text-2xl font-bold mt-1 ${
                  invoice.balanceDue > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                ${invoice.balanceDue.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Status
              </label>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mt-1 ${
                  invoice.status === "Paid"
                    ? "bg-green-100 text-green-800"
                    : invoice.status === "Partially Paid"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Section */}
      {invoice.balanceDue > 0 && (
        <div className="bg-white rounded-lg shadow-md border mb-8" id="payment">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Add Payment</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={paymentForm.amount}
                      onChange={handlePaymentChange}
                      step="0.01"
                      min="0"
                      max={invoice.balanceDue}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        paymentErrors.amount
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {paymentErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {paymentErrors.amount}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum: ${invoice.balanceDue.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="paymentDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      paymentErrors.paymentDate
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {paymentErrors.paymentDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {paymentErrors.paymentDate}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="paymentMethod"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Payment Method *
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      paymentErrors.paymentMethod
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Check">Check</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Other">Other</option>
                  </select>
                  {paymentErrors.paymentMethod && (
                    <p className="mt-1 text-sm text-red-600">
                      {paymentErrors.paymentMethod}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmittingPayment ? "Adding Payment..." : "Add Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipts Section */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Payment History
          </h2>
        </div>

        {receipts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {receipt.receiptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(receipt.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      ${receipt.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.paymentMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No payments have been made for this invoice yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
