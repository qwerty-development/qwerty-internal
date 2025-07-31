"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Users,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function ClientListPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Sorting state
  const [sortField, setSortField] = useState<string>("company_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Function to fetch clients
  const fetchClients = async () => {
    setRefreshing(true);
    setError(null);
    const { data, error } = await supabase
      .from("clients")
      .select(
        "id, company_name, company_email, contact_person_name, contact_person_email, contact_phone, address, mof_number, notes, regular_balance, paid_amount"
      );
    if (error) {
      setError(error.message);
      setClients([]);
    } else {
      setClients(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Function to handle manual refresh
  const handleRefresh = () => {
    fetchClients();
  };

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it as sort field and default to asc
      setSortField(field);
      setSortDirection("asc");
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

  // Filter and search clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_person_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.company_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_person_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.mof_number?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesBalance = true;
    if (balanceFilter === "outstanding") {
      matchesBalance = (client.regular_balance || 0) > 0;
    } else if (balanceFilter === "paid") {
      matchesBalance = (client.regular_balance || 0) <= 0;
    }

    return matchesSearch && matchesBalance;
  });

  // Sort filtered clients
  const sortedClients = [...filteredClients].sort((a, b) => {
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

  // Calculate summary statistics
  const stats = {
    total: clients.length,
    outstanding: clients.filter((client) => (client.regular_balance || 0) > 0)
      .length,
    totalOutstanding: clients.reduce(
      (sum, client) => sum + (client.regular_balance || 0),
      0
    ),
    totalPaid: clients.reduce(
      (sum, client) => sum + (client.paid_amount || 0),
      0
    ),
  };

  // Get balance status badge
  const getBalanceStatus = (balance: number) => {
    if (balance > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Outstanding
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Paid Up
        </span>
      );
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Auto-refresh clients every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchClients();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading clients...</p>
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
                Error Loading Clients
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
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="text-gray-600 mt-2">
                Manage your client relationships and financial data
                {!loading && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({clients.length}{" "}
                    {clients.length === 1 ? "client" : "clients"})
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
              <Link
                href="/admin/clients/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Client
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Clients
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.outstanding}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Outstanding
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ${stats.totalOutstanding.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Collected
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ${stats.totalPaid.toFixed(2)}
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
                  placeholder="Search clients, contacts, or MOF numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Balance Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={balanceFilter}
                  onChange={(e) => setBalanceFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Clients</option>
                  <option value="outstanding">With Outstanding Balance</option>
                  <option value="paid">Paid Up</option>
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
                      className={getHeaderStyle("company_name")}
                      onClick={() => handleSort("company_name")}
                    >
                      <div className="flex items-center">
                        Company
                        {getSortIcon("company_name")}
                      </div>
                    </th>
                    <th
                      className={getHeaderStyle("contact_person_name")}
                      onClick={() => handleSort("contact_person_name")}
                    >
                      <div className="flex items-center">
                        Contact Person
                        {getSortIcon("contact_person_name")}
                      </div>
                    </th>
                    <th
                      className={getHeaderStyle("company_email")}
                      onClick={() => handleSort("company_email")}
                    >
                      <div className="flex items-center">
                        Contact Info
                        {getSortIcon("company_email")}
                      </div>
                    </th>
                    <th
                      className={getHeaderStyle("regular_balance")}
                      onClick={() => handleSort("regular_balance")}
                    >
                      <div className="flex items-center">
                        Balance
                        {getSortIcon("regular_balance")}
                      </div>
                    </th>
                    <th
                      className={getHeaderStyle("paid_amount")}
                      onClick={() => handleSort("paid_amount")}
                    >
                      <div className="flex items-center">
                        Paid Amount
                        {getSortIcon("paid_amount")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {client.company_name}
                            </div>
                            {client.address && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {client.address}
                              </div>
                            )}
                            {client.mof_number && (
                              <div className="text-sm text-blue-600 font-medium mt-1">
                                MOF: {client.mof_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {client.contact_person_name || "-"}
                            </div>
                            {client.contact_person_email && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Mail className="w-3 h-3 mr-1" />
                                {client.contact_person_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {client.company_email && (
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {client.company_email}
                            </div>
                          )}
                          {client.contact_phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {client.contact_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <span
                            className={`text-sm font-medium ${
                              (client.regular_balance || 0) > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            ${(client.regular_balance || 0).toFixed(2)}
                          </span>
                          {getBalanceStatus(client.regular_balance || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-green-600">
                          ${(client.paid_amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                          <Link
                            href={`/admin/clients/${client.id}/edit`}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedClients.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Users className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || balanceFilter !== "all"
                    ? "No matching clients"
                    : "No clients found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || balanceFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating your first client."}
                </p>
                <Link
                  href="/admin/clients/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Client
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {client.company_name}
                      </h3>
                      {client.mof_number && (
                        <p className="text-sm text-blue-600 font-medium">
                          MOF: {client.mof_number}
                        </p>
                      )}
                    </div>
                  </div>
                  {getBalanceStatus(client.regular_balance || 0)}
                </div>

                <div className="space-y-3 mb-6">
                  {client.contact_person_name && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {client.contact_person_name}
                      </span>
                    </div>
                  )}

                  {client.company_email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {client.company_email}
                      </span>
                    </div>
                  )}

                  {client.contact_phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {client.contact_phone}
                      </span>
                    </div>
                  )}

                  {client.address && (
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <span className="text-sm text-gray-600">
                        {client.address}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Balance:</span>
                      <span
                        className={`text-sm font-bold ${
                          (client.regular_balance || 0) > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        ${(client.regular_balance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Paid:</span>
                      <span className="text-sm font-bold text-green-600">
                        ${(client.paid_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/admin/clients/${client.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Link>
                </div>
              </div>
            ))}

            {sortedClients.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Users className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || balanceFilter !== "all"
                    ? "No matching clients"
                    : "No clients found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || balanceFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating your first client."}
                </p>
                <Link
                  href="/admin/clients/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Client
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
