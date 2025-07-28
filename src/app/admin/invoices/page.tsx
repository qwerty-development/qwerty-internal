"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import Link from "next/link";
import { RefreshCw, ChevronUp, ChevronDown, Download } from "lucide-react";

export default function InvoiceListPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDFs, setGeneratingPDFs] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortField, setSortField] = useState<string>("invoice_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Function to fetch invoice data
  const fetchData = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Fetch invoices with client information
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          clients (
            id,
            name
          )
        `
        )
        .order(sortField, { ascending: sortDirection === "asc" });

      if (invoicesError) {
        setError(invoicesError.message);
      } else {
        setInvoices(invoicesData || []);
      }
    } catch (err) {
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it as sort field and default to desc
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Function to get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />
    );
  };

  // Function to get header styling based on sort state
  const getHeaderStyle = (field: string) => {
    const baseStyle =
      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors";
    if (sortField === field) {
      return `${baseStyle} text-blue-600 bg-blue-50`;
    }
    return `${baseStyle} text-gray-500`;
  };

  // Function to handle manual refresh
  const handleRefresh = () => {
    fetchData();
  };

  // Handle PDF generation
  const handleGeneratePDF = async (invoiceId: string) => {
    setGeneratingPDFs(prev => new Set(prev).add(invoiceId));
    try {
      await generateInvoicePDF(invoiceId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDFs(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  // Refetch data when sorting changes
  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [sortField, sortDirection]);

  // Auto-refresh invoices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [supabase]);

  const getClientName = (clientId: string) => {
    const invoice = invoices.find((inv) => inv.client_id === clientId);
    return invoice?.clients?.name || "Unknown Client";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Invoices
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">
            Manage your invoices and payment tracking{" "}
            {!loading && (
              <span className="ml-2 text-blue-600 font-medium">
                ({invoices.length}{" "}
                {invoices.length === 1 ? "invoice" : "invoices"})
              </span>
            )}
            {sortField !== "invoice_number" && (
              <span className="ml-2 text-sm text-gray-500">
                • Sorted by {sortField.replace("_", " ")} (
                {sortDirection === "asc" ? "ascending" : "descending"})
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/admin/invoices/new"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create New Invoice
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className={getHeaderStyle("invoice_number")}
                  onClick={() => handleSort("invoice_number")}
                >
                  <div className="flex items-center">
                    Invoice Number
                    {getSortIcon("invoice_number")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("client_id")}
                  onClick={() => handleSort("client_id")}
                >
                  <div className="flex items-center">
                    Client Name
                    {getSortIcon("client_id")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("issue_date")}
                  onClick={() => handleSort("issue_date")}
                >
                  <div className="flex items-center">
                    Issue Date
                    {getSortIcon("issue_date")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("due_date")}
                  onClick={() => handleSort("due_date")}
                >
                  <div className="flex items-center">
                    Due Date
                    {getSortIcon("due_date")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("total_amount")}
                  onClick={() => handleSort("total_amount")}
                >
                  <div className="flex items-center">
                    Total Amount
                    {getSortIcon("total_amount")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("amount_paid")}
                  onClick={() => handleSort("amount_paid")}
                >
                  <div className="flex items-center">
                    Amount Paid
                    {getSortIcon("amount_paid")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("balance_due")}
                  onClick={() => handleSort("balance_due")}
                >
                  <div className="flex items-center">
                    Balance Due
                    {getSortIcon("balance_due")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("status")}
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon("status")}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.clients?.name || "Unknown Client"}
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
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "partially_paid"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {invoice.status === "paid"
                        ? "Paid"
                        : invoice.status === "partially_paid"
                        ? "Partially Paid"
                        : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGeneratePDF(invoice.id)}
                        disabled={generatingPDFs.has(invoice.id)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-25 disabled:text-blue-400 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        {generatingPDFs.has(invoice.id) ? "Generating..." : "PDF"}
                      </button>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                      >
                        View Details
                      </Link>
                      {invoice.balance_due > 0 && (
                        <Link
                          href={`/admin/invoices/${invoice.id}#payment`}
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                        >
                          Add Payment
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first invoice.
            </p>
            <Link
              href="/admin/invoices/new"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create New Invoice
            </Link>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Invoices
              </p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {invoices.length}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {invoices.filter((inv) => inv.status === "paid").length}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  $
                  {invoices
                    .reduce((sum, inv) => sum + (inv.balance_due || 0), 0)
                    .toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Collected
              </p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  $
                  {invoices
                    .reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
                    .toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
