"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  RefreshCw,
  Plus,
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Bell,
  Eye,
  Calendar,
  MessageSquare,
  Building2,
  Users,
  AlertCircle,
  ArrowUpDown,
  Megaphone,
  Wrench,
  Sparkles,
  Bug,
  type LucideIcon,
} from "lucide-react";

interface Update {
  id: string;
  title: string;
  content: string;
  update_type: string;
  created_at: string;
  client_id: string | null;
  ticket_id: string | null;
  clients?: any;
  tickets?: any;
}

export default function AdminUpdatesPage() {
  const supabase = createClient();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filtering & search
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    announcements: 0,
    maintenance: 0,
    features: 0,
    bugFixes: 0,
  });

  // Fetch updates
  const fetchUpdates = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("updates")
        .select(
          `id, title, content, update_type, created_at, client_id, ticket_id, clients(id,company_name), tickets(id,title)`
        )
        .order(sortField, { ascending: sortDirection === "asc" });

      if (error) {
        setError(error.message);
      } else {
        const updatesData = (data || []) as Update[];
        setUpdates(updatesData);

        // Calculate statistics
        const total = updatesData.length;
        const announcements = updatesData.filter(u => u.update_type.toLowerCase() === "announcement").length;
        const maintenance = updatesData.filter(u => u.update_type.toLowerCase() === "maintenance").length;
        const features = updatesData.filter(u => u.update_type.toLowerCase() === "feature").length;
        const bugFixes = updatesData.filter(u => u.update_type.toLowerCase() === "bug fix" || u.update_type.toLowerCase() === "bug_fix").length;

        setStats({ total, announcements, maintenance, features, bugFixes });
      }
    } catch (err) {
      setError("Failed to load updates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortDirection]);

  // Sorting helpers
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getHeaderStyle = (field: string) => {
    const baseStyle =
      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200";
    return sortField === field ? `${baseStyle} text-blue-600 bg-blue-50` : `${baseStyle} text-gray-500`;
  };

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

  // Type badge config
  const getTypeConfig = (type: string): {
    label: string;
    className: string;
    icon: LucideIcon;
  } => {
    switch (type.toLowerCase()) {
      case "announcement":
        return { 
          label: "Announcement", 
          className: "bg-blue-100 text-blue-800",
          icon: Megaphone
        };
      case "maintenance":
        return { 
          label: "Maintenance", 
          className: "bg-yellow-100 text-yellow-800",
          icon: Wrench
        };
      case "feature":
        return { 
          label: "Feature", 
          className: "bg-green-100 text-green-800",
          icon: Sparkles
        };
      case "bug fix":
      case "bug_fix":
        return { 
          label: "Bug Fix", 
          className: "bg-red-100 text-red-800",
          icon: Bug
        };
      default:
        return { 
          label: "General", 
          className: "bg-gray-100 text-gray-800",
          icon: Bell
        };
    }
  };

  // Apply filters
  const filteredUpdates = updates.filter((upd) => {
    const matchesType = typeFilter === "all" || upd.update_type.toLowerCase() === typeFilter;
    const matchesSearch =
      searchTerm === "" ||
      upd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upd.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (upd.clients?.company_name && upd.clients.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesSearch;
  });

  // Sort filtered updates
  const sortedUpdates = [...filteredUpdates].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading updates...</p>
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
                Error Loading Updates
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
              <h1 className="text-3xl font-bold text-gray-900">Updates</h1>
              <p className="text-gray-600 mt-2">
                Manage customer updates and announcements
                {!loading && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({updates.length} {updates.length === 1 ? "update" : "updates"})
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/admin/updates/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Update
              </Link>
              <button
                onClick={fetchUpdates}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Updates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Megaphone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Announcements</p>
                <p className="text-2xl font-bold text-gray-900">{stats.announcements}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Features</p>
                <p className="text-2xl font-bold text-gray-900">{stats.features}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Bug className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bug Fixes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bugFixes}</p>
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
                  placeholder="Search updates, clients, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value.toLowerCase())}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="announcement">Announcement</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="feature">Feature</option>
                  <option value="bug fix">Bug Fix</option>
                  <option value="general">General</option>
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
                      className={getHeaderStyle("created_at")}
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Date
                        {getSortIcon("created_at")}
                      </div>
                    </th>
                    <th
                      className={getHeaderStyle("title")}
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center">
                        Title
                        {getSortIcon("title")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUpdates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {searchTerm || typeFilter !== "all" ? "No matching updates" : "No updates found"}
                        </h3>
                        <p className="text-sm">
                          {searchTerm || typeFilter !== "all" 
                            ? "Try adjusting your search or filter criteria."
                            : "Updates will appear here when you create them."
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sortedUpdates.map((upd) => {
                      const typeConfig = getTypeConfig(upd.update_type);
                      const TypeIcon = typeConfig.icon;

                      return (
                        <tr key={upd.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(upd.created_at)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatTime(upd.created_at)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            <div className="font-medium text-gray-900 truncate flex items-center">
                              <MessageSquare className="w-4 h-4 text-gray-400 mr-2" />
                              {upd.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {upd.content}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.className}`}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  {upd.client_id ? (
                                    <Building2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Users className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {upd.client_id ? upd.clients?.company_name || "-" : "All Customers"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/updates/${upd.id}`}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedUpdates.map((upd) => {
              const typeConfig = getTypeConfig(upd.update_type);
              const TypeIcon = typeConfig.icon;

              return (
                <div key={upd.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {upd.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(upd.created_at)} at {formatTime(upd.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.className}`}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {typeConfig.label}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {upd.content}
                    </div>

                    <div className="flex items-center">
                      {upd.client_id ? (
                        <>
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {upd.clients?.company_name || "Unknown Client"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            All Customers
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Link
                      href={`/admin/updates/${upd.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}

            {sortedUpdates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Bell className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || typeFilter !== "all" ? "No matching updates" : "No updates found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || typeFilter !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "Updates will appear here when you create them."
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {sortedUpdates.length} of {updates.length} updates
          {searchTerm && ` matching "${searchTerm}"`}
          {typeFilter !== "all" && ` of type "${typeFilter}"`}
        </div>
      </div>
    </div>
  );
} 