"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createPayment } from "@/utils/paymentCreation";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>(
    {}
  );
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch invoice, client, receipts, and items data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching invoice with ID:", invoiceId);
        console.log("Invoice ID type:", typeof invoiceId);

        // Validate invoice ID
        if (!invoiceId || invoiceId === "undefined" || invoiceId === "null") {
          setError("Invalid invoice ID");
          setLoading(false);
          return;
        }

        // Test database connection first
        console.log("Testing database connection...");
        const { data: testData, error: testError } = await supabase
          .from("invoices")
          .select("id")
          .limit(1);

        if (testError) {
          console.error("Database connection test failed:", testError);
          setError(`Database connection failed: ${testError.message}`);
          setLoading(false);
          return;
        }

        console.log("Database connection test successful");

        // Fetch invoice data (simplified to avoid join issues)
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();

        if (invoiceError) {
          console.error("Invoice fetch error:", invoiceError);
          setError(`Invoice not found: ${invoiceError.message}`);
          setLoading(false);
          return;
        }

        console.log("Invoice data:", invoiceData);
        setInvoice(invoiceData);

        // Fetch client data separately if client_id exists
        if (invoiceData.client_id) {
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("id, company_name, company_email, contact_phone, address")
            .eq("id", invoiceData.client_id)
            .single();

          if (clientError) {
            console.warn("Client fetch error:", clientError);
            setClient(null);
          } else {
            console.log("Client data:", clientData);
            setClient(clientData);
          }
        } else {
          console.warn("No client_id found for invoice:", invoiceData.id);
          setClient(null);
        }

        // Fetch receipts for this invoice
        const { data: receiptsData, error: receiptsError } = await supabase
          .from("receipts")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("payment_date", { ascending: false });

        if (receiptsError) {
          console.error("Receipts fetch error:", receiptsError);
        } else {
          setReceipts(receiptsData || []);
        }

        // Fetch invoice items if invoice uses items system
        if (invoiceData?.uses_items) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("invoice_items")
            .select("*")
            .eq("invoice_id", invoiceId)
            .order("position");

          if (itemsError) {
            console.error("Items fetch error:", itemsError);
          } else {
            setItems(itemsData || []);
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to load invoice data");
      }

      setLoading(false);
    };

    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId, supabase]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invoice Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The invoice you're looking for doesn't exist."}
          </p>
          {error && error.includes("Invoice not found:") && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
              <p className="text-yellow-800 text-sm">
                <strong>Debug Info:</strong> Invoice ID: {invoiceId}
              </p>
              <p className="text-yellow-800 text-sm mt-1">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
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
    } else if (parseFloat(paymentForm.amount) > invoice.balance_due) {
      newErrors.amount = `Amount cannot exceed balance due ($${invoice.balance_due.toFixed(
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

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePaymentForm()) {
      return;
    }

    setIsSubmittingPayment(true);

    try {
      // Generate receipt number first
      const { data: lastReceipt, error: receiptError } = await supabase
        .from("receipts")
        .select("receipt_number")
        .order("receipt_number", { ascending: false })
        .limit(1)
        .single();

      let receiptNumber = "REC-001";
      if (!receiptError && lastReceipt) {
        const match = lastReceipt.receipt_number.match(/REC-(\d+)/);
        if (match) {
          const lastNumber = parseInt(match[1], 10);
          const nextNumber = lastNumber + 1;
          receiptNumber = `REC-${nextNumber.toString().padStart(3, "0")}`;
        }
      }

      // Create payment using API
      const result = await createPayment({
        client_id: invoice.client_id,
        invoice_id: invoice.id,
        receipt_number: receiptNumber,
        payment_date: paymentForm.paymentDate,
        amount: paymentForm.amount,
        payment_method: paymentForm.paymentMethod,
      });

      if (result.success) {
        // Show success message
        setPaymentSuccess(true);
        setPaymentErrors({});

        // Reset form
        setPaymentForm({
          amount: "",
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "Bank Transfer",
        });

        // Refresh data after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to create payment");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add payment"
      );
      setIsSubmittingPayment(false);
    }
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(invoiceId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/admin/invoices"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
        >
          ← Back to Invoices
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {invoice.invoice_number}
            </h1>
            <p className="text-gray-600 mt-2">
              Invoice Details & Payment Management
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              📄 {isGeneratingPDF ? "Generating..." : "Generate PDF"}
            </button>
            {client && (
              <Link
                href={`/admin/clients/${client.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                View Client
              </Link>
            )}
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
                {invoice.invoice_number}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Client
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {client ? client.company_name : "Client not found"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Issue Date
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(invoice.issue_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Due Date
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(invoice.due_date).toLocaleDateString()}
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
                ${invoice.total_amount?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Amount Paid
              </label>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${invoice.amount_paid?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Balance Due
              </label>
              <p
                className={`text-2xl font-bold mt-1 ${
                  invoice.balance_due > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                ${invoice.balance_due?.toFixed(2) || "0.00"}
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

      {/* Invoice Items Section */}
      {invoice?.uses_items && items.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Invoice Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.description || (
                        <span className="text-gray-400 italic">
                          No description
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${item.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-right text-sm font-semibold text-gray-900"
                  >
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    $
                    {items
                      .reduce((sum, item) => sum + item.price, 0)
                      .toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add Payment Section */}
      {invoice.balance_due > 0 && (
        <div className="bg-white rounded-lg shadow-md border mb-8" id="payment">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Add Payment</h2>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            {paymentSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600">
                  Payment added successfully! Refreshing page...
                </p>
              </div>
            )}
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
                      max={invoice.balance_due}
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
                    Maximum: ${invoice.balance_due.toFixed(2)}
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
                      {receipt.receipt_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(receipt.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      ${receipt.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.payment_method}
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
