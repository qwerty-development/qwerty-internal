"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { generateReceiptPDF } from "@/utils/pdfGenerator";
import Link from "next/link";
import {
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Download,
  Search,
  Filter,
} from "lucide-react";

export default function ReceiptsPage() {
  const supabase = createClient();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDFs, setGeneratingPDFs] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortField, setSortField] = useState<string>("payment_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filtering state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    thisMonth: 0,
    thisMonthAmount: 0,
  });

  // Function to fetch receipt data
  const fetchData = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Fetch receipts with client and invoice information
      const { data: receiptsData, error: receiptsError } = await supabase
        .from("receipts")
        .select(
          `
          *,
          clients (
            id,
            name
          ),
          invoices (
            id,
            invoice_number
          )
        `
        )
        .order(sortField, { ascending: sortDirection === "asc" });

      if (receiptsError) {
        setError(receiptsError.message);
      } else {
        setReceipts(receiptsData || []);

        // Calculate statistics
        const total = receiptsData?.length || 0;
        const totalAmount =
          receiptsData?.reduce(
            (sum, receipt) => sum + (receipt.amount || 0),
            0
          ) || 0;

        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthReceipts =
          receiptsData?.filter(
            (receipt) => new Date(receipt.payment_date) >= thisMonth
          ) || [];
        const thisMonthCount = thisMonthReceipts.length;
        const thisMonthAmount = thisMonthReceipts.reduce(
          (sum, receipt) => sum + (receipt.amount || 0),
          0
        );

        setStats({
          total,
          totalAmount,
          thisMonth: thisMonthCount,
          thisMonthAmount,
        });
      }
    } catch (err) {
      setError("Failed to load receipts");
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

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to handle PDF generation
  const handleGeneratePDF = async (receiptId: string) => {
    setGeneratingPDFs(prev => new Set(prev).add(receiptId));
    try {
      await generateReceiptPDF(receiptId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDFs(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiptId);
        return newSet;
      });
    }
  };

  // Filter receipts based on search and payment method
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      searchTerm === "" ||
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.invoices?.invoice_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receipt.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      receipt.payment_method === paymentMethodFilter;

    return matchesSearch && matchesPaymentMethod;
  });

  useEffect(() => {
    fetchData();
  }, [supabase]);

  // Refetch data when sorting changes
  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [sortField, sortDirection]);

  // Auto-refresh receipts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [supabase]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading receipts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Receipts
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
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-2">
            Manage payment receipts and track transactions{" "}
            {!loading && (
              <span className="ml-2 text-blue-600 font-medium">
                ({receipts.length}{" "}
                {receipts.length === 1 ? "receipt" : "receipts"})
              </span>
            )}
            {sortField !== "payment_date" && (
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
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Receipts
              </p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.thisMonth}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Month Amount</p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.thisMonthAmount)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search receipts, clients, or invoice numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className={getHeaderStyle("receipt_number")}
                  onClick={() => handleSort("receipt_number")}
                >
                  <div className="flex items-center">
                    Receipt Number
                    {getSortIcon("receipt_number")}
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
                  className={getHeaderStyle("invoice_id")}
                  onClick={() => handleSort("invoice_id")}
                >
                  <div className="flex items-center">
                    Invoice Number
                    {getSortIcon("invoice_id")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("payment_date")}
                  onClick={() => handleSort("payment_date")}
                >
                  <div className="flex items-center">
                    Payment Date
                    {getSortIcon("payment_date")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("amount")}
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center">
                    Amount
                    {getSortIcon("amount")}
                  </div>
                </th>
                <th
                  className={getHeaderStyle("payment_method")}
                  onClick={() => handleSort("payment_method")}
                >
                  <div className="flex items-center">
                    Payment Method
                    {getSortIcon("payment_method")}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {receipt.receipt_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.clients?.name || "Unknown Client"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.invoices?.invoice_number || "Unknown Invoice"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(receipt.payment_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {formatCurrency(receipt.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        receipt.payment_method === "cash"
                          ? "bg-green-100 text-green-800"
                          : receipt.payment_method === "card"
                          ? "bg-blue-100 text-blue-800"
                          : receipt.payment_method === "bank transfer"
                          ? "bg-purple-100 text-purple-800"
                          : receipt.payment_method === "check"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {receipt.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGeneratePDF(receipt.id)}
                        disabled={generatingPDFs.has(receipt.id)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-25 disabled:text-blue-400 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        {generatingPDFs.has(receipt.id)
                          ? "Generating..."
                          : "PDF"}
                      </button>
                      <Link
                        href={`/admin/receipts/${receipt.id}`}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReceipts.length === 0 && (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No receipts found
            </h3>
            <p className="text-gray-500 mb-4">
              Receipts will appear here when payments are recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
