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
  Eye,
  Receipt,
  DollarSign,
  Calendar,
  User,
  Building2,
  CreditCard,
  Banknote,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  Plus,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function ReceiptsPage() {
  const supabase = createClient();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDFs, setGeneratingPDFs] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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
            company_name
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
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
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
      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200";
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
    setGeneratingPDFs((prev) => new Set(prev).add(receiptId));
    try {
      await generateReceiptPDF(receiptId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDFs((prev) => {
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
      receipt.clients?.company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receipt.invoices?.invoice_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receipt.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      receipt.payment_method === paymentMethodFilter;

    return matchesSearch && matchesPaymentMethod;
  });

  // Sort filtered receipts
  const sortedReceipts = [...filteredReceipts].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Get payment method badge styling
  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      cash: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: Banknote,
        label: "Cash",
      },
      card: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: CreditCard,
        label: "Card",
      },
      "bank transfer": {
        bg: "bg-purple-100",
        text: "text-purple-800",
        icon: Building2,
        label: "Bank Transfer",
      },
      check: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: CheckCircle,
        label: "Check",
      },
      other: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: DollarSign,
        label: "Other",
      },
    };

    const config =
      methodConfig[method as keyof typeof methodConfig] || methodConfig.other;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
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

  // Auto-refresh receipts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading receipts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
              <p className="text-gray-600 mt-2">
                Manage payment receipts and track transactions
                {!loading && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({receipts.length}{" "}
                    {receipts.length === 1 ? "receipt" : "receipts"})
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Receipts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.thisMonth}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Month Amount
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats.thisMonthAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search receipts, clients, or invoice numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Payment Method Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "cards"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === "table" ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedReceipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Receipt className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {receipt.receipt_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {receipt.clients?.company_name ||
                                "Unknown Client"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Receipt className="w-4 h-4 text-gray-400 mr-2" />
                          {receipt.invoices?.invoice_number ||
                            "Unknown Invoice"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(receipt.payment_date)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {formatCurrency(receipt.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(receipt.payment_method)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
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
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedReceipts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Receipt className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || paymentMethodFilter !== "all"
                    ? "No matching receipts"
                    : "No receipts found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || paymentMethodFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Receipts will appear here when payments are recorded."}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Receipt className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {receipt.receipt_number}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(receipt.payment_date)}
                      </p>
                    </div>
                  </div>
                  {getPaymentMethodBadge(receipt.payment_method)}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {receipt.clients?.company_name || "Unknown Client"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Receipt className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {receipt.invoices?.invoice_number || "Unknown Invoice"}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(receipt.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Payment Date:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(receipt.payment_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleGeneratePDF(receipt.id)}
                    disabled={generatingPDFs.has(receipt.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-25 disabled:text-blue-400 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {generatingPDFs.has(receipt.id) ? "Generating..." : "PDF"}
                  </button>
                  <Link
                    href={`/admin/receipts/${receipt.id}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Link>
                </div>
              </div>
            ))}

            {sortedReceipts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Receipt className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || paymentMethodFilter !== "all"
                    ? "No matching receipts"
                    : "No receipts found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || paymentMethodFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Receipts will appear here when payments are recorded."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
