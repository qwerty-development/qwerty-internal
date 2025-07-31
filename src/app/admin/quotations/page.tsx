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
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react";

// Define strict types for quotation status and sortable fields
type QuotationStatus = "Draft" | "Sent" | "Approved" | "Rejected" | "Converted";
type SortableField =
  | "created_at"
  | "quotation_number"
  | "company_name"
  | "total_amount"
  | "issue_date"
  | "due_date";

// Updated Quotation interface to accurately reflect possible data shapes
interface Quotation {
  id: string;
  quotation_number: string;
  company_name: string;
  company_email: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_phone: string;
  description: string;
  terms_and_conditions: string;
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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

  // Function to get sort icon
  const getSortIcon = (field: SortableField) => {
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
  const getHeaderStyle = (field: SortableField) => {
    const baseStyle =
      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200";
    if (sortField === field) {
      return `${baseStyle} text-blue-600 bg-blue-50`;
    }
    return `${baseStyle} text-gray-500`;
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
          className: "bg-gray-100 text-gray-800",
          icon: FileText,
          label: "Draft",
        };
      case "Sent":
        return {
          className: "bg-blue-100 text-blue-800",
          icon: Send,
          label: "Sent",
        };
      case "Approved":
        return {
          className: "bg-green-100 text-green-800",
          icon: CheckCircle,
          label: "Approved",
        };
      case "Rejected":
        return {
          className: "bg-red-100 text-red-800",
          icon: XCircle,
          label: "Rejected",
        };
      case "Converted":
        return {
          className: "bg-purple-100 text-purple-800",
          icon: CheckCircle,
          label: "Converted",
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800",
          icon: FileText,
          label: "Unknown",
        };
    }
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
    setGeneratingPDFs((prev) => new Set(prev).add(quotationId));
    try {
      await generateQuotationPDF(quotationId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDFs((prev) => {
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
      quotation.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.company_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (quotation.contact_person_name &&
        quotation.contact_person_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort filtered quotations
  const sortedQuotations = [...filteredQuotations].sort((a, b) => {
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

  useEffect(() => {
    fetchQuotations();
  }, [sortField, sortDirection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading quotations...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
              <p className="text-gray-600 mt-2">
                Manage quotations and track their status
                {!loading && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({quotations.length}{" "}
                    {quotations.length === 1 ? "quotation" : "quotations"})
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchQuotations}
                disabled={refreshing}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <Link
                href="/admin/quotations/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Quotation
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Quotations
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.draft + stats.sent}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.approved}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats.totalValue)}
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
                  placeholder="Search quotations, clients, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as QuotationStatus | "all")
                  }
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Converted">Converted</option>
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
                      className={getHeaderStyle("quotation_number")}
                      onClick={() => handleSort("quotation_number")}
                    >
                      <div className="flex items-center">
                        Quote #{getSortIcon("quotation_number")}
                      </div>
                    </th>
                    <th
                      className={getHeaderStyle("company_name")}
                      onClick={() => handleSort("company_name")}
                    >
                      <div className="flex items-center">
                        Company
                        {getSortIcon("company_name")}
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
                        Amount
                        {getSortIcon("total_amount")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedQuotations.map((quotation) => {
                    const statusConfig = getStatusConfig(quotation.status);
                    const StatusIcon = statusConfig?.icon || FileText;

                    return (
                      <tr
                        key={quotation.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {quotation.quotation_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(quotation.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {quotation.company_name}
                              </div>
                              {quotation.company_email && (
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {quotation.company_email}
                                </div>
                              )}
                              {quotation.contact_person_name && (
                                <div className="text-sm text-blue-600 flex items-center mt-1">
                                  <User className="w-3 h-3 mr-1" />
                                  {quotation.contact_person_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(quotation.issue_date)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {quotation.due_date ? (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              {formatDate(quotation.due_date)}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                            {formatCurrency(quotation.total_amount)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusConfig?.className ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig?.label || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
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
                              {generatingPDFs.has(quotation.id)
                                ? "Generating..."
                                : "PDF"}
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
                  })}
                </tbody>
              </table>
            </div>

            {sortedQuotations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <FileText className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No matching quotations"
                    : "No quotations found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating your first quotation."}
                </p>
                <Link
                  href="/admin/quotations/new"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Quotation
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedQuotations.map((quotation) => {
              const statusConfig = getStatusConfig(quotation.status);
              const StatusIcon = statusConfig?.icon || FileText;

              return (
                <div
                  key={quotation.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quotation.quotation_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(quotation.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusConfig?.className || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig?.label || "Unknown"}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {quotation.company_name}
                      </span>
                    </div>

                    {quotation.company_email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {quotation.company_email}
                        </span>
                      </div>
                    )}

                    {quotation.contact_person_name && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {quotation.contact_person_name}
                        </span>
                      </div>
                    )}

                    {quotation.contact_phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {quotation.contact_phone}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Issue Date:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(quotation.issue_date)}
                        </span>
                      </div>
                      {quotation.due_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Due Date:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(quotation.due_date)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(quotation.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/quotations/${quotation.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                    <button
                      onClick={() => handleGeneratePDF(quotation.id)}
                      disabled={generatingPDFs.has(quotation.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-25 disabled:text-blue-400 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {generatingPDFs.has(quotation.id)
                        ? "Generating..."
                        : "PDF"}
                    </button>
                  </div>

                  {/* Status-specific actions */}
                  <div className="mt-3 flex items-center space-x-2">
                    {quotation.status === "Draft" && (
                      <button
                        onClick={() =>
                          updateQuotationStatus(quotation.id, "Sent")
                        }
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </button>
                    )}
                    {quotation.status === "Sent" && (
                      <>
                        <button
                          onClick={() =>
                            updateQuotationStatus(quotation.id, "Approved")
                          }
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            updateQuotationStatus(quotation.id, "Rejected")
                          }
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
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
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Convert
                        </button>
                      )}
                  </div>
                </div>
              );
            })}

            {sortedQuotations.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <FileText className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No matching quotations"
                    : "No quotations found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating your first quotation."}
                </p>
                <Link
                  href="/admin/quotations/new"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Quotation
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
