"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { generateReceiptPDF } from "@/utils/pdfGenerator";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  User,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  Eye,
} from "lucide-react";

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.id as string;
  const supabase = createClient();

  const [receipt, setReceipt] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Fetch receipt details with related data
  useEffect(() => {
    const fetchReceiptData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching receipt with ID:", receiptId);

        // Validate receipt ID
        if (!receiptId || receiptId === "undefined" || receiptId === "null") {
          setError("Invalid receipt ID");
          setLoading(false);
          return;
        }

        // Fetch receipt data with client and invoice information
        const { data: receiptData, error: receiptError } = await supabase
          .from("receipts")
          .select(
            `
            *,
            clients (
              id,
              company_name,
              company_email,
              contact_phone,
              address
            ),
            invoices (
              id,
              invoice_number,
              total_amount,
              amount_paid,
              balance_due,
              status,
              issue_date,
              due_date,
              description
            )
          `
          )
          .eq("id", receiptId)
          .single();

        if (receiptError) {
          console.error("Receipt fetch error:", receiptError);
          setError(`Receipt not found: ${receiptError.message}`);
          setLoading(false);
          return;
        }

        console.log("Receipt data:", receiptData);
        setReceipt(receiptData);

        // Set client and invoice data from the joined query
        if (receiptData.clients) {
          setClient(receiptData.clients);
        }
        if (receiptData.invoices) {
          setInvoice(receiptData.invoices);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to load receipt data");
      }

      setLoading(false);
    };

    if (receiptId) {
      fetchReceiptData();
    }
  }, [receiptId, supabase]);

  // Generate PDF
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateReceiptPDF(receiptId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Send email with PDF
  const handleSendEmail = async () => {
    if (!client?.company_email) {
      alert("Client does not have an email address.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/receipts/${receiptId}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(`Email sent successfully to ${client.company_email}!`);
      } else {
        alert(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Format functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "card":
        return "bg-blue-100 text-blue-800";
      case "bank transfer":
        return "bg-purple-100 text-purple-800";
      case "check":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Receipt Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The receipt you're looking for doesn't exist."}
          </p>
          {error && error.includes("Receipt not found:") && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
              <p className="text-yellow-800 text-sm">
                <strong>Debug Info:</strong> Receipt ID: {receiptId}
              </p>
              <p className="text-yellow-800 text-sm mt-1">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
          <Link
            href="/admin/receipts"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Receipts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/admin/receipts"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Receipts
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Receipt {receipt.receipt_number}
            </h1>
            <p className="text-gray-600 mt-2">
              Payment Details & Transaction Information
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? "Generating..." : "Generate PDF"}
            </button>
            {client?.company_email && (
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                📧 {isSendingEmail ? "Sending..." : "Send Email"}
              </button>
            )}
            {client && (
              <Link
                href={`/admin/clients/${client.id}`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                View Client
              </Link>
            )}
            {invoice && (
              <Link
                href={`/admin/invoices/${invoice.id}`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Invoice
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Receipt Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Receipt Number
              </label>
              <p className="text-sm text-gray-900 mt-1 font-medium">
                {receipt.receipt_number}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Payment Date
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {formatDate(receipt.payment_date)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Payment Method
              </label>
              <p className="text-sm text-gray-900 mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(
                    receipt.payment_method
                  )}`}
                >
                  {receipt.payment_method}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Amount Paid
              </label>
              <p className="text-sm text-green-600 font-medium mt-1">
                {formatCurrency(receipt.amount)}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500">
                Created At
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {formatDate(receipt.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment Summary
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Payment Amount
              </label>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(receipt.amount)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Payment Method
              </label>
              <div className="flex items-center mt-1">
                <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(
                    receipt.payment_method
                  )}`}
                >
                  {receipt.payment_method}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Payment Date
              </label>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {formatDate(receipt.payment_date)}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Receipt Status
              </label>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                ✓ Payment Confirmed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      {client && (
        <div className="bg-white rounded-lg shadow-md border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Client Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Client Name
                </label>
                <p className="text-sm text-gray-900 mt-1 font-medium">
                  {client.company_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Contact Email
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {client.company_email || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Contact Phone
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {client.contact_phone || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Address
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {client.address || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Information */}
      {invoice && (
        <div className="bg-white rounded-lg shadow-md border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Related Invoice
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Invoice Number
                </label>
                <p className="text-sm text-gray-900 mt-1 font-medium">
                  {invoice.invoice_number}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Issue Date
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(invoice.issue_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Due Date
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(invoice.due_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Invoice Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
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

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Total Amount
                </label>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatCurrency(invoice.total_amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Amount Paid
                </label>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {formatCurrency(invoice.amount_paid)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Balance Due
                </label>
                <p
                  className={`text-lg font-bold mt-1 ${
                    invoice.balance_due > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(invoice.balance_due)}
                </p>
              </div>
            </div>

            {invoice.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500">
                  Invoice Description
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {invoice.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Impact Summary */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Impact Summary
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(receipt.amount)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Payment Amount</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {invoice
                  ? formatCurrency(invoice.amount_paid)
                  : formatCurrency(receipt.amount)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Total Paid to Date
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {invoice ? formatCurrency(invoice.balance_due) : "N/A"}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Remaining Balance
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Receipt Number:</span>
                <span className="ml-2 font-medium">
                  {receipt.receipt_number}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Payment Method:</span>
                <span className="ml-2 font-medium">
                  {receipt.payment_method}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Payment Date:</span>
                <span className="ml-2 font-medium">
                  {formatDate(receipt.payment_date)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium">
                  {formatDate(receipt.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
