"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  status: string;
  created_at: string;
  is_converted: boolean;
  converted_to_invoice_id: string | null;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("quotation_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  // Function to fetch quotations
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order(sortField, { ascending: sortDirection === "asc" });

      if (error) {
        throw error;
      }

      setQuotations(data || []);
    } catch (err) {
      console.error("Error fetching quotations:", err);
      setError("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  // Function to update quotation status
  const updateQuotationStatus = async (
    quotationId: string,
    newStatus: string
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

      // Refresh the quotations list
      fetchQuotations();
    } catch (err) {
      console.error("Error updating quotation status:", err);
      alert("Failed to update quotation status");
    }
  };

  // Function to assign quotation to client
  const assignToClient = async (quotationId: string, clientId: string) => {
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ client_id: clientId })
        .eq("id", quotationId);

      if (error) {
        throw error;
      }

      // Refresh the quotations list
      fetchQuotations();
    } catch (err) {
      console.error("Error assigning quotation to client:", err);
      alert("Failed to assign quotation to client");
    }
  };

  // Fetch quotations on component mount and when sort changes
  useEffect(() => {
    fetchQuotations();
  }, [sortField, sortDirection]);

  // Function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Converted":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quotations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchQuotations}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
              <p className="mt-2 text-gray-600">
                Manage quotations and track their status
              </p>
            </div>
            <Link
              href="/admin/quotations/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Quotation
            </Link>
          </div>

          {/* Sort indicator */}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>
              Sorting by {sortField.replace("_", " ")} (
              {sortDirection === "asc" ? "ascending" : "descending"})
            </span>
            {sortField !== "quotation_number" && (
              <span className="ml-2 text-sm text-gray-500">
                • Sorted by {sortField.replace("_", " ")} (
                {sortDirection === "asc" ? "ascending" : "descending"})
              </span>
            )}
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("quotation_number")}
                  >
                    <div className="flex items-center">
                      Quote #
                      {sortField === "quotation_number" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("client_name")}
                  >
                    <div className="flex items-center">
                      Client Name
                      {sortField === "client_name" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("issue_date")}
                  >
                    <div className="flex items-center">
                      Issue Date
                      {sortField === "issue_date" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("due_date")}
                  >
                    <div className="flex items-center">
                      Due Date
                      {sortField === "due_date" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("total_amount")}
                  >
                    <div className="flex items-center">
                      Total Amount
                      {sortField === "total_amount" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === "status" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quotation.quotation_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {quotation.client_name}
                        </div>
                        {quotation.client_email && (
                          <div className="text-gray-500 text-xs">
                            {quotation.client_email}
                          </div>
                        )}
                        {quotation.client_phone && (
                          <div className="text-gray-500 text-xs">
                            {quotation.client_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(quotation.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quotation.due_date
                        ? formatDate(quotation.due_date)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(quotation.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                          quotation.status
                        )}`}
                      >
                        {quotation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/quotations/${quotation.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/quotations/${quotation.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        {quotation.status === "Draft" && (
                          <button
                            onClick={() =>
                              updateQuotationStatus(quotation.id, "Sent")
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            Send
                          </button>
                        )}
                        {quotation.status === "Sent" && (
                          <>
                            <button
                              onClick={() =>
                                updateQuotationStatus(quotation.id, "Approved")
                              }
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                updateQuotationStatus(quotation.id, "Rejected")
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {quotation.status === "Approved" &&
                          !quotation.is_converted && (
                            <Link
                              href={`/admin/quotations/${quotation.id}/convert`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Convert to Invoice
                            </Link>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {quotations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No quotations found</p>
              <Link
                href="/admin/quotations/new"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create your first quotation
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
