"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  deleteClientCompletely,
  getClientDeletionSummary,
} from "@/utils/clientDeletion";
import { getClientPassword } from "@/utils/passwordOperations";
import DeleteClientDialog from "@/components/DeleteClientDialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  DollarSign,
  FileText,
  Receipt,
  Copy,
  Eye,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const clientId = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [clientReceipts, setClientReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionSummary, setDeletionSummary] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch client details
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();

        if (clientError) {
          setError("Client not found");
          setLoading(false);
          return;
        }

        setClient(clientData);

        // Fetch client invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("client_id", clientId);

        if (!invoicesError) {
          setClientInvoices(invoicesData || []);
        }

        // Fetch client receipts
        const { data: receiptsData, error: receiptsError } = await supabase
          .from("receipts")
          .select("*")
          .eq("client_id", clientId);

        if (!receiptsError) {
          setClientReceipts(receiptsData || []);
        }
      } catch (err) {
        setError("Failed to load client data");
      }

      setLoading(false);
    };

    if (clientId) {
      fetchClientData();
    }
  }, [clientId, supabase]);

  const handleDeleteClick = async () => {
    setShowDeleteDialog(true);
    try {
      const summaryResult = await getClientDeletionSummary(clientId);
      if (summaryResult.success && summaryResult.summary) {
        setDeletionSummary(summaryResult.summary);
      } else {
        console.error("Failed to get deletion summary:", summaryResult);
        setError(
          summaryResult.error ||
            summaryResult.message ||
            "Failed to load deletion summary"
        );
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error fetching deletion summary:", error);
      setError("Failed to load deletion summary");
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const result = await deleteClientCompletely(clientId);

    if (result.success) {
      router.push("/admin/clients");
    } else {
      setError(result.error || "Failed to delete client");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletionSummary(null);
  };

  const handleGetPassword = async () => {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    setGeneratedPassword(null);

    try {
      const result = await getClientPassword(clientId);

      if (result.success) {
        setGeneratedPassword(result.password || null);
        setPasswordSuccess(
          result.message || "Password retrieved successfully!"
        );
        setShowPasswordDialog(true);
      } else {
        setPasswordError(result.error || "Failed to get password");
      }
    } catch (error) {
      console.error("Password retrieval error:", error);
      setPasswordError("An unexpected error occurred");
    }

    setPasswordLoading(false);
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        setPasswordSuccess("Password copied to clipboard!");
        setTimeout(() => setPasswordSuccess(null), 2000);
      } catch (err) {
        setPasswordError("Failed to copy password");
      }
    }
  };

  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setGeneratedPassword(null);
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  // Calculate financial statistics
  const calculateStats = () => {
    const totalInvoices = clientInvoices.length;
    const totalReceipts = clientReceipts.length;
    const totalInvoiceAmount = clientInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalPaidAmount = clientReceipts.reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const outstandingBalance = totalInvoiceAmount - totalPaidAmount;

    return {
      totalInvoices,
      totalReceipts,
      totalInvoiceAmount,
      totalPaidAmount,
      outstandingBalance
    };
  };

  // Get invoice status badge
  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      "Paid": {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Paid"
      },
      "Partially Paid": {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "Partially Paid"
      },
      "Unpaid": {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: AlertCircle,
        label: "Unpaid"
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["Unpaid"];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Client Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                The client you're looking for doesn't exist.
              </p>
              <Link
                href="/admin/clients"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Clients
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/admin/clients"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {client.company_name}
              </h1>
              <p className="text-gray-600 mt-2">
                Client Details & Financial Summary
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/admin/clients/${client.id}/edit`}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Client
              </Link>
              <button
                onClick={handleDeleteClick}
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Client
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                <p className={`text-lg font-bold ${stats.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(stats.outstandingBalance)}
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
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(stats.totalPaidAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Receipt className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReceipts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Client Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Company Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.company_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Mail className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Company Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.company_email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Contact Person Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.contact_person_name || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <Mail className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Contact Person Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.contact_person_email || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <Phone className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Contact Phone
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.contact_phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      MOF Number
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.mof_number || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Address
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.address || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Notes
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client.notes || "No notes"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Management Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Client Access
                  </h3>
                  <p className="text-sm text-gray-600">
                    Copy the original password for this client
                  </p>
                </div>
                <button
                  onClick={handleGetPassword}
                  disabled={passwordLoading}
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                >
                  {passwordLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Password
                    </>
                  )}
                </button>
              </div>

              {passwordError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{passwordSuccess}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Financial Summary
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Regular Balance
                </label>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    client.regular_balance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(client.regular_balance || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Total Paid
                </label>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(client.paid_amount || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Total Invoices
                </label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {clientInvoices.length}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Total Receipts
                </label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {clientReceipts.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Invoices for this Client
              </h2>
              <Link
                href="/admin/invoices/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Invoice
              </Link>
            </div>
          </div>

          {clientInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Due
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
                  {clientInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          {invoice.invoice_number}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(invoice.issue_date)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(invoice.due_date)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                          {formatCurrency(invoice.total_amount || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {formatCurrency(invoice.amount_paid || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                          {formatCurrency(invoice.balance_due || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getInvoiceStatusBadge(invoice.status || "Unpaid")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <FileText className="mx-auto h-12 w-12" />
              </div>
              <p className="text-gray-500 mb-4">
                No invoices found for this client.
              </p>
              <Link
                href="/admin/invoices/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create First Invoice
              </Link>
            </div>
          )}
        </div>

        {/* Receipts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Receipts for this Client
            </h2>
          </div>

          {clientReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Receipt className="w-4 h-4 text-gray-400 mr-2" />
                          {receipt.receipt_number}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(receipt.payment_date)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {formatCurrency(receipt.amount || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                          {receipt.payment_method || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          {clientInvoices.find(
                            (inv) => inv.id === receipt.invoice_id
                          )?.invoice_number || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Receipt className="mx-auto h-12 w-12" />
              </div>
              <p className="text-gray-500">No receipts found for this client.</p>
            </div>
          )}
        </div>

        {/* Delete Client Dialog */}
        <DeleteClientDialog
          isOpen={showDeleteDialog}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          summary={deletionSummary}
          loading={deleting}
        />

        {/* Password Dialog */}
        {showPasswordDialog && generatedPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Client Password
                  </h3>
                  <button
                    onClick={closePasswordDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    This is the original password generated for this client.
                    Please copy it and share it securely with the client.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Original Password
                      </label>
                      <button
                        onClick={copyToClipboard}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-300">
                      <code className="text-sm font-mono text-gray-900 break-all">
                        {generatedPassword}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={closePasswordDialog}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
