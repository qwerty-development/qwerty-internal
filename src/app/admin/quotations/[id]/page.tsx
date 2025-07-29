"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { generateQuotationPDF } from "@/utils/pdfGenerator";
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  Plus,
  Eye,
  Download,
  type LucideIcon,
} from "lucide-react";

interface Quotation {
  id: string;
  quotation_number: string;
  company_name: string;
  company_email: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_phone: string;
  address: string;
  mof_number: string;
  notes: string;
  client_id: string | null;
  description: string;
  terms_and_conditions: string;
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
  uses_items?: boolean;
}

interface QuotationItem {
  id: string;
  quotation_id: string;
  position: number;
  title: string;
  description: string | null;
  price: number;
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
  const supabase = createClient();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showClientAssignment, setShowClientAssignment] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  // Fetch quotation items
  const fetchQuotationItems = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/items`);
      const items = await response.json();

      if (Array.isArray(items)) {
        setQuotationItems(items);
      } else {
        console.error("Invalid response format:", items);
        setQuotationItems([]);
      }
    } catch (err) {
      console.error("Error fetching quotation items:", err);
      setQuotationItems([]);
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
      if (newStatus === "Approved") {
        // Use the new approval API that handles client creation
        const response = await fetch(`/api/quotations/${quotationId}/approve`, {
          method: "POST",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to approve quotation");
        }

        const result = await response.json();
        if (result.success) {
          alert(
            "Quotation approved successfully! Client created automatically."
          );
        }
      } else {
        // Handle other status updates (Rejected, etc.)
        const updateData: any = { status: newStatus };

        if (newStatus === "Rejected") {
          updateData.rejected_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from("quotations")
          .update(updateData)
          .eq("id", quotationId);

        if (error) {
          throw error;
        }
      }

      fetchQuotation();
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err instanceof Error ? err.message : "Failed to update status");
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

  // Generate PDF
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateQuotationPDF(quotationId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Convert to invoice
  const convertToInvoice = async () => {
    if (!quotation) {
      console.error("No quotation data available");
      alert("Error: No quotation data available");
      return;
    }

    console.log("🚀 STARTING CONVERSION");
    console.log("📋 Quotation Data:", quotation);
    console.log("🆔 Quotation ID:", quotationId);

    try {
      console.log(
        "📡 Making API call to:",
        `/api/quotations/${quotationId}/convert`
      );

      const response = await fetch(`/api/quotations/${quotationId}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);
      console.log(
        "📥 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        console.error(
          "❌ Response not OK:",
          response.status,
          response.statusText
        );
        let errorText = "";
        try {
          const error = await response.json();
          console.error("❌ Error response body:", error);
          errorText = error.error || "Failed to convert quotation";
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log("✅ Conversion result:", result);

      if (result.success && result.invoice) {
        console.log("🎉 SUCCESS! Invoice created:");
        console.log("📄 Invoice object:", result.invoice);
        console.log("🆔 Invoice ID:", result.invoice.id);
        console.log("🏷️ Invoice number:", result.invoice.invoice_number);
        console.log("👤 Client ID:", result.clientId);

        const invoiceId = result.invoice.id;
        const navigationUrl = `/admin/invoices/${invoiceId}`;

        console.log("🧭 Navigation URL:", navigationUrl);

        alert(`Invoice ${result.invoice.invoice_number} created successfully!`);

        // Add a small delay to ensure the alert is seen
        setTimeout(() => {
          console.log("🧭 Attempting navigation...");
          router.push(navigationUrl);
        }, 1000);
      } else {
        console.error(
          "❌ Conversion succeeded but no invoice returned:",
          result
        );
        alert(
          "Conversion succeeded but invoice details are missing. Check console for details."
        );
        // Don't redirect yet, let's see what's in the result
      }
    } catch (err) {
      console.error("💥 CONVERSION ERROR:", err);
      console.error("📊 Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        quotationId,
        quotation: quotation
          ? {
              id: quotation.id,
              status: quotation.status,
              client_id: quotation.client_id,
            }
          : "null",
      });

      alert(
        `Conversion failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  useEffect(() => {
    fetchQuotation();
    fetchQuotationItems();
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

  const getStatusConfig = (
    status: string
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Quotation
          </h1>
          <p className="text-gray-600 mb-6">{error || "Quotation not found"}</p>
          <Link
            href="/admin/quotations"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Quotations
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(quotation.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/admin/quotations"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotations
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quotation {quotation.quotation_number}
            </h1>
            <p className="text-gray-600 mt-1">
              Created on {formatDate(quotation.created_at)}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/quotations/${quotation.id}/edit`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? "Generating..." : "Generate PDF"}
            </button>
            {quotation.status === "Draft" && (
              <button
                onClick={() => updateStatus("Sent")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Quotation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.className}`}
            >
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusConfig.label}
            </span>
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(quotation.updated_at)}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              {isGeneratingPDF ? "Generating..." : "PDF"}
            </button>

            {quotation.status === "Sent" && (
              <>
                <button
                  onClick={() => updateStatus("Approved")}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Approve
                </button>
                <button
                  onClick={() => updateStatus("Rejected")}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </button>
              </>
            )}

            {quotation.status === "Approved" && !quotation.is_converted && (
              <>
                <button
                  onClick={() => setShowClientAssignment(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  Assign Client
                </button>
                {quotation.client_id && (
                  <button
                    onClick={convertToInvoice}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                  >
                    <DollarSign className="w-3 h-3" />
                    Convert to Invoice
                  </button>
                )}
              </>
            )}

            {quotation.is_converted && quotation.converted_to_invoice_id && (
              <Link
                href={`/admin/invoices/${quotation.converted_to_invoice_id}`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                View Invoice
              </Link>
            )}
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quotation Items */}
          <div className="bg-white rounded-lg shadow-md border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Quotation Items
                </h2>
                <Link
                  href={`/admin/quotations/${quotation.id}/edit`}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit Items
                </Link>
              </div>
            </div>

            {quotationItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotationItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                              {index + 1}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.title}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {item.description || (
                              <span className="text-gray-400 italic">
                                No description
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.price)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          Total:
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(quotation.total_amount)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No items added</p>
                  <p className="text-sm mb-4">
                    This quotation doesn't have any line items yet.
                  </p>
                  <Link
                    href={`/admin/quotations/${quotation.id}/edit`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Items
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {quotation.description && (
            <div className="bg-white rounded-lg shadow-md border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {quotation.description}
                </p>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          {quotation.terms_and_conditions && (
            <div className="bg-white rounded-lg shadow-md border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Terms and Conditions
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {quotation.terms_and_conditions}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Client Information
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Company Name
                </div>
                <div className="text-sm text-gray-900 font-medium">
                  {quotation.company_name}
                </div>
              </div>
              {quotation.company_email && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Company Email
                  </div>
                  <div className="text-sm text-gray-900">
                    {quotation.company_email}
                  </div>
                </div>
              )}
              {quotation.contact_person_name && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Contact Person
                  </div>
                  <div className="text-sm text-gray-900">
                    {quotation.contact_person_name}
                  </div>
                </div>
              )}
              {quotation.contact_person_email && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Contact Email
                  </div>
                  <div className="text-sm text-gray-900">
                    {quotation.contact_person_email}
                  </div>
                </div>
              )}
              {quotation.contact_phone && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Contact Phone
                  </div>
                  <div className="text-sm text-gray-900">
                    {quotation.contact_phone}
                  </div>
                </div>
              )}
              {quotation.mof_number && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    MOF Number
                  </div>
                  <div className="text-sm text-gray-900">
                    {quotation.mof_number}
                  </div>
                </div>
              )}
              {quotation.address && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Address
                  </div>
                  <div className="text-sm text-gray-900">
                    {quotation.address}
                  </div>
                </div>
              )}
              {quotation.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Notes
                  </div>
                  <div className="text-sm text-gray-900">{quotation.notes}</div>
                </div>
              )}
              {quotation.client_id && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Assigned to client
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Details */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quotation Details
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Number
                </div>
                <div className="text-sm text-gray-900 font-medium">
                  {quotation.quotation_number}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Issue Date
                </div>
                <div className="text-sm text-gray-900">
                  {formatDate(quotation.issue_date)}
                </div>
              </div>
              {quotation.due_date && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due Date
                  </div>
                  <div className="text-sm text-gray-900">
                    {formatDate(quotation.due_date)}
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Total Amount
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(quotation.total_amount)}
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Status Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-900">
                  {formatDate(quotation.created_at)}
                </span>
              </div>
              {quotation.approved_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Approved</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(quotation.approved_at)}
                  </span>
                </div>
              )}
              {quotation.rejected_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Rejected</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(quotation.rejected_at)}
                  </span>
                </div>
              )}
              {quotation.is_converted && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Converted</span>
                  <span className="text-sm text-green-600 font-medium">
                    ✓ To Invoice
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
