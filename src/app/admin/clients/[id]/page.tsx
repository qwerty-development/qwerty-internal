"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  deleteClientCompletely,
  getClientDeletionSummary,
} from "@/utils/clientDeletion";
import { getClientPassword } from "@/utils/passwordOperations";
import DeleteClientDialog from "@/components/DeleteClientDialog";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const clientId = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [clientReceipts, setClientReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionSummary, setDeletionSummary] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch client details
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();

        if (clientError) {
          setError("Client not found");
          setLoading(false);
          return;
        }

        setClient(clientData);

        // Fetch client invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("client_id", clientId);

        if (!invoicesError) {
          setClientInvoices(invoicesData || []);
        }

        // Fetch client receipts
        const { data: receiptsData, error: receiptsError } = await supabase
          .from("receipts")
          .select("*")
          .eq("client_id", clientId);

        if (!receiptsError) {
          setClientReceipts(receiptsData || []);
        }
      } catch (err) {
        setError("Failed to load client data");
      }

      setLoading(false);
    };

    if (clientId) {
      fetchClientData();
    }
  }, [clientId, supabase]);

  const handleDeleteClick = async () => {
    setShowDeleteDialog(true);
    try {
      const summaryResult = await getClientDeletionSummary(clientId);
      if (summaryResult.success && summaryResult.summary) {
        setDeletionSummary(summaryResult.summary);
      } else {
        console.error("Failed to get deletion summary:", summaryResult);
        setError(
          summaryResult.error ||
            summaryResult.message ||
            "Failed to load deletion summary"
        );
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error fetching deletion summary:", error);
      setError("Failed to load deletion summary");
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const result = await deleteClientCompletely(clientId);

    if (result.success) {
      router.push("/admin/clients");
    } else {
      setError(result.error || "Failed to delete client");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletionSummary(null);
  };

  const handleGetPassword = async () => {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    setGeneratedPassword(null);

    try {
      const result = await getClientPassword(clientId);

      if (result.success) {
        setGeneratedPassword(result.password || null);
        setPasswordSuccess(
          result.message || "Password retrieved successfully!"
        );
        setShowPasswordDialog(true);
      } else {
        setPasswordError(result.error || "Failed to get password");
      }
    } catch (error) {
      console.error("Password retrieval error:", error);
      setPasswordError("An unexpected error occurred");
    }

    setPasswordLoading(false);
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        setPasswordSuccess("Password copied to clipboard!");
        setTimeout(() => setPasswordSuccess(null), 2000);
      } catch (err) {
        setPasswordError("Failed to copy password");
      }
    }
  };

  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setGeneratedPassword(null);
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Client Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The client you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/clients"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Clients
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
          href="/admin/clients"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
        >
          ← Back to Clients
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-2">
              Client Details & Financial Summary
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/admin/clients/${client.id}/edit`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit Client
            </Link>
            <button
              onClick={handleDeleteClick}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Delete Client
            </button>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Client Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Name
              </label>
              <p className="text-sm text-gray-900 mt-1">{client.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Phone
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {client.contact_phone || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Email
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {client.contact_email || "Not provided"}
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

          {/* Password Management Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Client Access
                </h3>
                <p className="text-sm text-gray-600">
                  Copy the original password for this client
                </p>
              </div>
              <button
                onClick={handleGetPassword}
                disabled={passwordLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {passwordLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Password
                  </>
                )}
              </button>
            </div>

            {passwordError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{passwordSuccess}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Financial Summary
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Regular Balance
              </label>
              <p
                className={`text-2xl font-bold mt-1 ${
                  client.regular_balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                ${client.regular_balance?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Total Paid
              </label>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${client.paid_amount?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Total Invoices
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {clientInvoices.length}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Total Receipts
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {clientReceipts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-white rounded-lg shadow-md border mb-8">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Invoices for this Client
            </h2>
            <Link
              href="/admin/invoices/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Create Invoice
            </Link>
          </div>
        </div>

        {clientInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.total_amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ${invoice.amount_paid?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.balance_due?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : invoice.status === "Partially Paid"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.status || "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No invoices found for this client.
            </p>
            <Link
              href="/admin/invoices/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create First Invoice
            </Link>
          </div>
        )}
      </div>

      {/* Receipts Section */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Receipts for this Client
          </h2>
        </div>

        {clientReceipts.length > 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {receipt.receipt_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(receipt.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      ${receipt.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.payment_method || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clientInvoices.find(
                        (inv) => inv.id === receipt.invoice_id
                      )?.invoice_number || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No receipts found for this client.</p>
          </div>
        )}
      </div>

      {/* Delete Client Dialog */}
      <DeleteClientDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        summary={deletionSummary}
        loading={deleting}
      />

      {/* Password Dialog */}
      {showPasswordDialog && generatedPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Client Password
                </h3>
                <button
                  onClick={closePasswordDialog}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  This is the original password generated for this client.
                  Please copy it and share it securely with the client.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Original Password
                    </label>
                    <button
                      onClick={copyToClipboard}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-300">
                    <code className="text-sm font-mono text-gray-900 break-all">
                      {generatedPassword}
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closePasswordDialog}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
