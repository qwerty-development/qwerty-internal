"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  Download,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  page: string;
  file_url: string | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
  client: {
    name: string;
    email: string;
  };
  viewed: boolean;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      fetchTicket();
    }
  }, [params.id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          *,
          client:clients(name, email)
        `
        )
        .eq("id", params.id)
        .single();

      if (error) throw error;

      if (data) {
        setTicket(data);
        // Mark ticket as viewed if it hasn't been viewed yet
        if (!data.viewed) {
          await markAsViewed(data.id);
        }
      }
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ viewed: true })
        .eq("id", ticketId);

      if (error) throw error;
    } catch (err) {
      console.error("Error marking ticket as viewed:", err);
    }
  };

  const updateStatus = async (status: "approved" | "declined") => {
    if (!ticket) return;

    try {
      setUpdating(true);
      setError(null);

      const { error } = await supabase
        .from("tickets")
        .update({ status })
        .eq("id", ticket.id);

      if (error) throw error;

      // Update local state
      setTicket((prev) => (prev ? { ...prev, status } : null));
    } catch (err) {
      console.error("Error updating ticket status:", err);
      setError("Failed to update ticket status");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "declined":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-32 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Ticket Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                {error || "The requested ticket could not be found."}
              </p>
              <button
                onClick={() => router.push("/admin/tickets")}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/admin/tickets")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </button>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                ticket.status
              )}`}
            >
              {getStatusIcon(ticket.status)}
              <span className="ml-1 capitalize">{ticket.status}</span>
            </span>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              Created on {formatDate(ticket.created_at)}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Client Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Client Information
              </h3>
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <p className="font-medium text-gray-900">
                    {ticket.client.name}
                  </p>
                  <p className="text-sm text-gray-600">{ticket.client.email}</p>
                </div>
              </div>
            </div>

            {/* Page/Route */}
            {ticket.page && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Page/Route
                </h3>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                  {ticket.page}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Description
              </h3>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* File Attachment */}
            {ticket.file_url && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Attachment
                </h3>
                <a
                  href={ticket.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </a>
              </div>
            )}

            {/* Status Actions */}
            {ticket.status === "pending" && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Update Status
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateStatus("approved")}
                    disabled={updating}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {updating ? "Updating..." : "Approve"}
                  </button>
                  <button
                    onClick={() => updateStatus("declined")}
                    disabled={updating}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {updating ? "Updating..." : "Decline"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
