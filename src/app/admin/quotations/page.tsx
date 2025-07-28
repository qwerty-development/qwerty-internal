"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { generateQuotationPDF } from "@/utils/pdfGenerator";
import Link from "next/link";
import {
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  User,
  Download,
  type LucideIcon,
} from "lucide-react";

// Define strict types for quotation status and sortable fields
type QuotationStatus = "Draft" | "Sent" | "Approved" | "Rejected" | "Converted";
type SortableField =
  | "created_at"
  | "quotation_number"
  | "client_name"
  | "total_amount"
  | "issue_date"
  | "due_date";

// Updated Quotation interface to accurately reflect possible data shapes
interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  description: string;
  total_amount: number;
  issue_date: string;
  due_date: string | null;
  status: QuotationStatus;
  created_at: string;
  is_converted: boolean;
  converted_to_invoice_id: string | null;
}

export default function QuotationsPage() {
  const supabase = createClient();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDFs, setGeneratingPDFs] = useState<Set<string>>(new Set());

  // Filtering and search state with stricter types
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "all">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<SortableField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    approved: 0,
    rejected: 0,
    converted: 0,
    totalValue: 0,
  });

  // Function to fetch quotations
  const fetchQuotations = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order(sortField, { ascending: sortDirection === "asc" });

      if (error) {
        setError(error.message);
      } else {
        const typed = (data ?? []) as unknown as Quotation[];
        setQuotations(typed);

        // Calculate statistics
        const total = typed.length;
        const draft = typed.filter((q) => q.status === "Draft").length;
        const sent = typed.filter((q) => q.status === "Sent").length;
        const approved = typed.filter((q) => q.status === "Approved").length;
        const rejected = typed.filter((q) => q.status === "Rejected").length;
        const converted = typed.filter((q) => q.status === "Converted").length;
        const totalValue = typed.reduce((sum, q) => sum + q.total_amount, 0);

        setStats({
          total,
          draft,
          sent,
          approved,
          rejected,
          converted,
          totalValue,
        });
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
      setError("Failed to load quotations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle sorting
  const handleSort = (field: SortableField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Function to update quotation status
  const updateQuotationStatus = async (
    quotationId: string,
    newStatus: QuotationStatus
  ) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "Approved") {
        updateData.approved_at = new Date().toISOString();
      } else if (newStatus === "Rejected") {
        updateData.rejected_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("quotations")
        .update(updateData)
        .eq("id", quotationId);

      if (error) {
        throw error;
      }

      fetchQuotations();
    } catch (err) {
      console.error("Error updating quotation status:", err);
      alert("Failed to update quotation status");
    }
  };

  // Function to get status configuration
  const getStatusConfig = (
    status: QuotationStatus
  ): {
    className: string;
    icon: LucideIcon;
    label: string;
  } => {
    switch (status) {
      case "Draft":
        return {
          className: "bg-gray-100 text-gray-800 border border-gray-200",
          icon: FileText,
          label: "Draft",
        };
      case "Sent":
        return {
          className: "bg-blue-100 text-blue-800 border border-blue-200",
          icon: Send,
          label: "Sent",
        };
      case "Approved":
        return {
          className: "bg-green-100 text-green-800 border border-green-200",
          icon: CheckCircle,
          label: "Approved",
        };
      case "Rejected":
        return {
          className: "bg-red-100 text-red-800 border border-red-200",
          icon: XCircle,
          label: "Rejected",
        };
      case "Converted":
        return {
          className: "bg-purple-100 text-purple-800 border border-purple-200",
          icon: CheckCircle,
          label: "Converted",
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800 border border-gray-200",
          icon: FileText,
          label: "Unknown",
        };
    }
  };

  // Function to get header style
  const getHeaderStyle = (field: SortableField) => {
    return sortField === field
      ? "bg-blue-50 text-blue-700 font-semibold"
      : "bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer";
  };

  // Function to get sort icon
  const getSortIcon = (field: SortableField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Function to convert quotation to invoice
  const handleGeneratePDF = async (quotationId: string) => {
    setGeneratingPDFs(prev => new Set(prev).add(quotationId));
    try {
      await generateQuotationPDF(quotationId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDFs(prev => {
        const newSet = new Set(prev);
        newSet.delete(quotationId);
        return newSet;
      });
    }
  };

  const convertQuotationToInvoice = async (quotationId: string) => {
    try {
      console.log("🚀 Converting quotation to invoice:", quotationId);

      const response = await fetch(`/api/quotations/${quotationId}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Conversion failed:", error);
        alert(`Failed to convert quotation: ${error.error}`);
        return;
      }

      const result = await response.json();
      console.log("✅ Conversion result:", result);

      if (result.success && result.invoice) {
        alert(`Invoice ${result.invoice.invoice_number} created successfully!`);
        // Navigate to the invoice
        window.location.href = `/admin/invoices/${result.invoice.id}`;
      } else {
        alert("Conversion succeeded but invoice details are missing.");
      }
    } catch (error) {
      console.error("💥 Conversion error:", error);
      alert(
        `Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Filter quotations based on search and status
  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      searchTerm === "" ||
      quotation.quotation_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      quotation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.client_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchQuotations();
  }, [sortField, sortDirection]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading quotations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Quotations
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-2">
            Manage quotations and track their status
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchQuotations}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/admin/quotations/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Create Quotation
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Quotations
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.draft + stats.sent}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as QuotationStatus | "all")
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Converted">Converted</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search quotations, clients, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${getHeaderStyle(
                    "quotation_number"
                  )}`}
                  onClick={() => handleSort("quotation_number")}
                >
                  <div className="flex items-center">
                    Quote #{getSortIcon("quotation_number")}
                  </div>
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${getHeaderStyle(
                    "client_name"
                  )}`}
                  onClick={() => handleSort("client_name")}
                >
                  <div className="flex items-center">
                    Client
                    {getSortIcon("client_name")}
                  </div>
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${getHeaderStyle(
                    "issue_date"
                  )}`}
                  onClick={() => handleSort("issue_date")}
                >
                  <div className="flex items-center">
                    Issue Date
                    {getSortIcon("issue_date")}
                  </div>
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${getHeaderStyle(
                    "due_date"
                  )}`}
                  onClick={() => handleSort("due_date")}
                >
                  <div className="flex items-center">
                    Due Date
                    {getSortIcon("due_date")}
                  </div>
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${getHeaderStyle(
                    "total_amount"
                  )}`}
                  onClick={() => handleSort("total_amount")}
                >
                  <div className="flex items-center">
                    Amount
                    {getSortIcon("total_amount")}
                  </div>
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
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">
                        No quotations found
                      </p>
                      <p className="text-sm">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quotation) => {
                  const statusConfig = getStatusConfig(quotation.status);
                  const StatusIcon = statusConfig?.icon || FileText;

                  return (
                    <tr key={quotation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium text-gray-900">
                          {quotation.quotation_number}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDate(quotation.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            {quotation.client_name}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {quotation.client_email}
                          </div>
                          {quotation.client_phone && (
                            <div className="text-sm text-gray-500">
                              {quotation.client_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(quotation.issue_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quotation.due_date ? (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(quotation.due_date)}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                          {formatCurrency(quotation.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            statusConfig?.className ||
                            "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig?.label || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/quotations/${quotation.id}`}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                          <button
                            onClick={() => handleGeneratePDF(quotation.id)}
                            disabled={generatingPDFs.has(quotation.id)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-25 disabled:text-blue-400 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            {generatingPDFs.has(quotation.id) ? "Generating..." : "PDF"}
                          </button>
                          <Link
                            href={`/admin/quotations/${quotation.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>
                          {quotation.status === "Draft" && (
                            <button
                              onClick={() =>
                                updateQuotationStatus(quotation.id, "Sent")
                              }
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              Send
                            </button>
                          )}
                          {quotation.status === "Sent" && (
                            <>
                              <button
                                onClick={() =>
                                  updateQuotationStatus(
                                    quotation.id,
                                    "Approved"
                                  )
                                }
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  updateQuotationStatus(
                                    quotation.id,
                                    "Rejected"
                                  )
                                }
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                          {quotation.status === "Approved" &&
                            !quotation.is_converted && (
                              <button
                                onClick={() =>
                                  convertQuotationToInvoice(quotation.id)
                                }
                                className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                              >
                                <DollarSign className="w-3 h-3" />
                                Convert
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
