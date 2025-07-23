"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  client_id: string | null;
  description: string;
  total_amount: number;
  issue_date: string;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  is_converted: boolean;
  converted_to_invoice_id: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_by: string;
}

interface Client {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
}

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showClientAssignment, setShowClientAssignment] = useState(false);

  // Fetch quotation details
  const fetchQuotation = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", quotationId)
        .single();

      if (error) {
        throw error;
      }

      setQuotation(data);
    } catch (err) {
      console.error("Error fetching quotation:", err);
      setError("Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients for assignment
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, contact_email, contact_phone")
        .order("name");

      if (error) {
        throw error;
      }

      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  // Update quotation status
  const updateStatus = async (newStatus: string) => {
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

      // Refresh quotation data
      fetchQuotation();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  // Assign quotation to client
  const assignToClient = async () => {
    if (!selectedClientId) {
      alert("Please select a client");
      return;
    }

    try {
      const { error } = await supabase
        .from("quotations")
        .update({ client_id: selectedClientId })
        .eq("id", quotationId);

      if (error) {
        throw error;
      }

      setShowClientAssignment(false);
      fetchQuotation();
    } catch (err) {
      console.error("Error assigning to client:", err);
      alert("Failed to assign to client");
    }
  };

  // Convert to invoice
  const convertToInvoice = async () => {
    if (!quotation) return;

    try {
      // Create invoice from quotation
      const invoiceData = {
        client_id: quotation.client_id,
        quotation_id: quotation.id,
        description: quotation.description,
        total_amount: quotation.total_amount.toString(),
        issue_date: new Date().toISOString().split("T")[0],
        due_date:
          quotation.due_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }

      const result = await response.json();

      // Update quotation to mark as converted
      const { error } = await supabase
        .from("quotations")
        .update({
          status: "Converted",
          is_converted: true,
          converted_to_invoice_id: result.invoice.id,
        })
        .eq("id", quotationId);

      if (error) {
        throw error;
      }

      // Redirect to the new invoice
      router.push(`/admin/invoices/${result.invoice.id}`);
    } catch (err) {
      console.error("Error converting to invoice:", err);
      alert("Failed to convert to invoice");
    }
  };

  useEffect(() => {
    fetchQuotation();
    fetchClients();
  }, [quotationId]);

  // Format functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quotation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error || "Quotation not found"}</p>
            <Link
              href="/admin/quotations"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Quotations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/quotations"
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Quotations
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  Quotation {quotation.quotation_number}
                </h1>
              </div>
              <p className="mt-2 text-gray-600">
                Created on {formatDate(quotation.created_at)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/quotations/${quotation.id}/edit`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </Link>
              {quotation.status === "Draft" && (
                <button
                  onClick={() => updateStatus("Sent")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Send Quotation
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Status Management
          </h2>
          <div className="flex items-center space-x-4">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(
                quotation.status
              )}`}
            >
              {quotation.status}
            </span>

            {quotation.status === "Sent" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => updateStatus("Approved")}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Mark as Approved
                </button>
                <button
                  onClick={() => updateStatus("Rejected")}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Mark as Rejected
                </button>
              </div>
            )}

            {quotation.status === "Approved" && !quotation.is_converted && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowClientAssignment(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Assign to Client
                </button>
                {quotation.client_id && (
                  <button
                    onClick={convertToInvoice}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    Convert to Invoice
                  </button>
                )}
              </div>
            )}

            {quotation.is_converted && quotation.converted_to_invoice_id && (
              <Link
                href={`/admin/invoices/${quotation.converted_to_invoice_id}`}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                View Invoice
              </Link>
            )}
          </div>
        </div>

        {/* Client Assignment Modal */}
        {showClientAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Assign to Client</h3>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.contact_email})
                  </option>
                ))}
              </select>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClientAssignment(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={assignToClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quotation Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Quotation Details
            </h2>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Client Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Name:
                    </span>
                    <p className="text-sm text-gray-900">
                      {quotation.client_name}
                    </p>
                  </div>
                  {quotation.client_email && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Email:
                      </span>
                      <p className="text-sm text-gray-900">
                        {quotation.client_email}
                      </p>
                    </div>
                  )}
                  {quotation.client_phone && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Phone:
                      </span>
                      <p className="text-sm text-gray-900">
                        {quotation.client_phone}
                      </p>
                    </div>
                  )}
                  {quotation.client_id && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Assigned Client:
                      </span>
                      <p className="text-sm text-green-600">
                        ✓ Assigned to client
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quotation Information */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Quotation Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Quotation Number:
                    </span>
                    <p className="text-sm text-gray-900">
                      {quotation.quotation_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Issue Date:
                    </span>
                    <p className="text-sm text-gray-900">
                      {formatDate(quotation.issue_date)}
                    </p>
                  </div>
                  {quotation.due_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Due Date:
                      </span>
                      <p className="text-sm text-gray-900">
                        {formatDate(quotation.due_date)}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Total Amount:
                    </span>
                    <p className="text-sm text-gray-900 font-semibold">
                      {formatCurrency(quotation.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Description
              </h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {quotation.description}
              </p>
            </div>

            {/* Status Timeline */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Status Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900">
                    {formatDate(quotation.created_at)}
                  </span>
                </div>
                {quotation.approved_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved:</span>
                    <span className="text-gray-900">
                      {formatDate(quotation.approved_at)}
                    </span>
                  </div>
                )}
                {quotation.rejected_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rejected:</span>
                    <span className="text-gray-900">
                      {formatDate(quotation.rejected_at)}
                    </span>
                  </div>
                )}
                {quotation.is_converted && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Converted to Invoice:</span>
                    <span className="text-green-600">✓ Converted</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
