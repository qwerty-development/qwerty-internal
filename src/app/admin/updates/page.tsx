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

  // Filtering & search
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
        setUpdates((data || []) as Update[]);
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
  const getHeaderStyle = (field: string) => {
    const base =
      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors";
    return sortField === field ? `${base} bg-gray-100` : base;
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  // Type badge config
  const getTypeConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case "announcement":
        return { label: "Announcement", className: "bg-blue-100 text-blue-800 border border-blue-200" };
      case "maintenance":
        return { label: "Maintenance", className: "bg-yellow-100 text-yellow-800 border border-yellow-200" };
      case "feature":
        return { label: "Feature", className: "bg-green-100 text-green-800 border border-green-200" };
      case "bug fix":
      case "bug_fix":
        return { label: "Bug Fix", className: "bg-red-100 text-red-800 border border-red-200" };
      default:
        return { label: "General", className: "bg-gray-100 text-gray-800 border border-gray-200" };
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Loading updates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Updates</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Updates</h1>
          <p className="text-gray-600 mt-2">Manage customer updates and announcements</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/updates/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Update
          </Link>
          <button
            onClick={fetchUpdates}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border p-6 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value.toLowerCase())}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="announcement">Announcement</option>
            <option value="maintenance">Maintenance</option>
            <option value="feature">Feature</option>
            <option value="bug fix">Bug Fix</option>
            <option value="general">General</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search updates, clients, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Updates Table */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={getHeaderStyle("created_at")} onClick={() => setSortField("created_at")}>Date {getSortIcon("created_at")}</th>
                <th className={getHeaderStyle("title")} onClick={() => setSortField("title")}>Title {getSortIcon("title")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUpdates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No updates found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredUpdates.map((upd) => {
                  const typeConfig = getTypeConfig(upd.update_type);
                  return (
                    <tr key={upd.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(upd.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-gray-500 text-xs">
                          {new Date(upd.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-medium text-gray-900 truncate">
                          {upd.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {upd.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${typeConfig.className}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {upd.client_id ? upd.clients?.company_name || "-" : "All Customers"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/updates/${upd.id}`}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                        >
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

      <div className="mt-6 text-center text-sm text-gray-500">
        Showing {filteredUpdates.length} of {updates.length} updates
        {searchTerm && ` matching "${searchTerm}"`}
        {typeFilter !== "all" && ` of type "${typeFilter}"`}
      </div>
    </div>
  );
} 