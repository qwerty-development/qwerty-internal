"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
} from "lucide-react";

interface Ticket {
  id: string;
  client_id: string;
  title: string;
  description: string;
  page: string;
  file_url: string | null;
  status: string;
  created_at: string;
  viewed: boolean;
  clients: {
    id: string;
    name: string;
    contact_email: string;
  };
}

export default function AdminTicketsPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtering and search state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0,
  });

  // Function to fetch tickets
  const fetchTickets = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          id,
          client_id,
          title,
          description,
          page,
          file_url,
          status,
          created_at,
          viewed,
          clients (
            id,
            name,
            contact_email
          )
        `
        )
        .order(sortField, { ascending: sortDirection === "asc" });

      if (error) {
        setError(error.message);
      } else {
        setTickets(data || []);

        // Debug: Log the first ticket to see what fields we have
        if (data && data.length > 0) {
          console.log("First ticket data:", data[0]);
        }

        // Calculate statistics
        const total = data?.length || 0;
        const pending = data?.filter((t) => t.status === "pending").length || 0;
        const approved =
          data?.filter((t) => t.status === "approved").length || 0;
        const declined =
          data?.filter((t) => t.status === "declined").length || 0;

        setStats({ total, pending, approved, declined });
      }
    } catch (err) {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Function to update ticket status
  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) {
        console.error("Error updating ticket status:", error);
        return false;
      }

      // Refresh tickets
      fetchTickets();
      return true;
    } catch (err) {
      console.error("Error updating ticket status:", err);
      return false;
    }
  };

  // Get header style for sorting
  const getHeaderStyle = (field: string) => {
    const baseStyle =
      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors";
    return sortField === field ? `${baseStyle} bg-gray-100` : baseStyle;
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  // Filter tickets based on status and search
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          className: "bg-green-100 text-green-800 border border-green-200",
          icon: CheckCircle,
          label: "Approved",
        };
      case "declined":
        return {
          className: "bg-red-100 text-red-800 border border-red-200",
          icon: XCircle,
          label: "Declined",
        };
      default:
        return {
          className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
          icon: Clock,
          label: "Pending",
        };
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [sortField, sortDirection]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Tickets
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
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-2">
            Manage client support tickets and requests
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
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
                {stats.pending}
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
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Declined</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.declined}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tickets, clients, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
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
              {filteredTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No tickets found</p>
                    <p className="text-sm">
                      Try adjusting your filters or search terms
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(ticket.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-gray-500 text-xs">
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate flex items-center">
                            {(ticket.viewed === false ||
                              ticket.viewed === null ||
                              ticket.viewed === undefined) && (
                              <div
                                className="w-3 h-3 bg-red-500 rounded-full mr-2 flex-shrink-0 animate-pulse"
                                title={`New ticket (viewed: ${ticket.viewed})`}
                              ></div>
                            )}
                            {ticket.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {ticket.description}
                          </div>
                          {/* Debug: Show viewed status */}
                          <div className="text-xs text-gray-400 mt-1">
                            Viewed: {String(ticket.viewed)} (Type: {typeof ticket.viewed})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.clients.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ticket.clients.contact_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.page || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/tickets/${ticket.id}`}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                          {ticket.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  updateTicketStatus(ticket.id, "approved")
                                }
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  updateTicketStatus(ticket.id, "declined")
                                }
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                Decline
                              </button>
                            </>
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

      {/* Results Summary */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Showing {filteredTickets.length} of {tickets.length} tickets
        {searchTerm && ` matching "${searchTerm}"`}
        {statusFilter !== "all" && ` with status "${statusFilter}"`}
      </div>
    </div>
  );
}
