"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createPayment } from "@/utils/paymentCreation";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Mail,
  User,
  Calendar,
  DollarSign,
  Building2,
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Plus,
  type LucideIcon,
} from "lucide-react";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>(
    {}
  );
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailNotification, setEmailNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Fetch invoice, client, receipts, and items data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching invoice with ID:", invoiceId);
        console.log("Invoice ID type:", typeof invoiceId);

        // Validate invoice ID
        if (!invoiceId || invoiceId === "undefined" || invoiceId === "null") {
          setError("Invalid invoice ID");
          setLoading(false);
          return;
        }

        // Test database connection first
        console.log("Testing database connection...");
        const { data: testData, error: testError } = await supabase
          .from("invoices")
          .select("id")
          .limit(1);

        if (testError) {
          console.error("Database connection test failed:", testError);
          setError(`Database connection failed: ${testError.message}`);
          setLoading(false);
          return;
        }

        console.log("Database connection test successful");

        // Fetch invoice data (simplified to avoid join issues)
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();

        if (invoiceError) {
          console.error("Invoice fetch error:", invoiceError);
          setError(`Invoice not found: ${invoiceError.message}`);
          setLoading(false);
          return;
        }

        console.log("Invoice data:", invoiceData);
        setInvoice(invoiceData);

        // Fetch client data separately if client_id exists
        if (invoiceData.client_id) {
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("id, company_name, company_email, contact_phone, address")
            .eq("id", invoiceData.client_id)
            .single();

          if (clientError) {
            console.warn("Client fetch error:", clientError);
            setClient(null);
          } else {
            console.log("Client data:", clientData);
            setClient(clientData);
          }
        } else {
          console.warn("No client_id found for invoice:", invoiceData.id);
          setClient(null);
        }

        // Fetch receipts for this invoice
        const { data: receiptsData, error: receiptsError } = await supabase
          .from("receipts")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("payment_date", { ascending: false });

        if (receiptsError) {
          console.error("Receipts fetch error:", receiptsError);
        } else {
          setReceipts(receiptsData || []);
        }

        // Fetch invoice items if invoice uses items system
        if (invoiceData?.uses_items) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("invoice_items")
            .select("*")
            .eq("invoice_id", invoiceId)
            .order("position");

          if (itemsError) {
            console.error("Items fetch error:", itemsError);
          } else {
            setItems(itemsData || []);
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to load invoice data");
      }

      setLoading(false);
    };

    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId, supabase]);

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

  // Get payment method badge
  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      "Bank Transfer": {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: CreditCard,
        label: "Bank Transfer"
      },
      "Cash": {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: DollarSign,
        label: "Cash"
      },
      "Credit Card": {
        bg: "bg-purple-100",
        text: "text-purple-800",
        icon: CreditCard,
        label: "Credit Card"
      },
      "Check": {
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: FileText,
        label: "Check"
      },
      "PayPal": {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        icon: CreditCard,
        label: "PayPal"
      },
      "Other": {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: CreditCard,
        label: "Other"
      }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig["Other"];
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
            <p className="text-gray-600 mt-4">Loading invoice details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Invoice Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                {error || "The invoice you're looking for doesn't exist."}
              </p>
              {error && error.includes("Invoice not found:") && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                  <p className="text-yellow-800 text-sm">
                    <strong>Debug Info:</strong> Invoice ID: {invoiceId}
                  </p>
                  <p className="text-yellow-800 text-sm mt-1">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}
              <Link
                href="/admin/invoices"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const validatePaymentForm = () => {
    const newErrors: Record<string, string> = {};

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    } else if (parseFloat(paymentForm.amount) > invoice.balance_due) {
      newErrors.amount = `Amount cannot exceed balance due (${formatCurrency(invoice.balance_due)})`;
    }

    if (!paymentForm.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }

    if (!paymentForm.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required";
    }

    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePaymentForm()) {
      return;
    }

    setIsSubmittingPayment(true);

    try {
      // Generate receipt number first
      const { data: lastReceipt, error: receiptError } = await supabase
        .from("receipts")
        .select("receipt_number")
        .order("receipt_number", { ascending: false })
        .limit(1)
        .single();

      let receiptNumber = "REC-001";
      if (!receiptError && lastReceipt) {
        const match = lastReceipt.receipt_number.match(/REC-(\d+)/);
        if (match) {
          const lastNumber = parseInt(match[1], 10);
          const nextNumber = lastNumber + 1;
          receiptNumber = `REC-${nextNumber.toString().padStart(3, "0")}`;
        }
      }

      // Create payment using API
      const result = await createPayment({
        client_id: invoice.client_id,
        invoice_id: invoice.id,
        receipt_number: receiptNumber,
        payment_date: paymentForm.paymentDate,
        amount: paymentForm.amount,
        payment_method: paymentForm.paymentMethod,
      });

      if (result.success) {
        // Show success message
        setPaymentSuccess(true);
        setPaymentErrors({});

        // Reset form
        setPaymentForm({
          amount: "",
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "Bank Transfer",
        });

        // Refresh data after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to create payment");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add payment"
      );
      setIsSubmittingPayment(false);
    }
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(invoiceId);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Send email with PDF
  const handleSendEmail = async () => {
    if (!client?.company_email) {
      setEmailNotification({
        type: 'error',
        message: 'Client does not have an email address configured.'
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailNotification({ type: null, message: '' });
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setEmailNotification({
          type: 'success',
          message: `✅ Email sent successfully to ${client.company_email}!`
        });
      } else {
        setEmailNotification({
          type: 'error',
          message: `❌ Failed to send email: ${result.error}`
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailNotification({
        type: 'error',
        message: '❌ Failed to send email. Please check your connection and try again.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/admin/invoices"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 mt-2">
                Invoice Details & Payment Management
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </button>
              {client?.company_email && (
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              )}
              {client && (
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  View Client
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Email Notification */}
        {emailNotification.type && (
          <div className={`mb-6 p-4 rounded-lg border ${
            emailNotification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{emailNotification.message}</span>
              <button
                onClick={() => setEmailNotification({ type: null, message: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total_amount || 0)}
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
                <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(invoice.amount_paid || 0)}
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
                <p className="text-sm font-medium text-gray-600">Balance Due</p>
                <p className={`text-lg font-bold ${invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(invoice.balance_due || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payments</p>
                <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Invoice Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Invoice Number
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {invoice.invoice_number}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Client
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {client ? client.company_name : "Client not found"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Issue Date
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(invoice.issue_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Due Date
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <div className="mt-1">
                      {getInvoiceStatusBadge(invoice.status || "Unpaid")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {invoice.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Financial Summary
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Total Amount
                </label>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(invoice.total_amount || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Amount Paid
                </label>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(invoice.amount_paid || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Balance Due
                </label>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    invoice.balance_due > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(invoice.balance_due || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  {getInvoiceStatusBadge(invoice.status || "Unpaid")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items Section */}
        {invoice?.uses_items && items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Invoice Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.position}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.title}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {item.description || (
                          <span className="text-gray-400 italic">
                            No description
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-right text-sm font-semibold text-gray-900"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(items.reduce((sum, item) => sum + item.price, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Add Payment Section */}
        {invoice.balance_due > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8" id="payment">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Payment</h2>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
              {paymentSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600">
                    Payment added successfully! Refreshing page...
                  </p>
                </div>
              )}
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <DollarSign className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={paymentForm.amount}
                        onChange={handlePaymentChange}
                        step="0.01"
                        min="0"
                        max={invoice.balance_due}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          paymentErrors.amount
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {paymentErrors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {paymentErrors.amount}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum: {formatCurrency(invoice.balance_due)}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="paymentDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Payment Date *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        id="paymentDate"
                        name="paymentDate"
                        value={paymentForm.paymentDate}
                        onChange={handlePaymentChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          paymentErrors.paymentDate
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    {paymentErrors.paymentDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {paymentErrors.paymentDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="paymentMethod"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Payment Method *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <CreditCard className="w-4 h-4" />
                      </span>
                      <select
                        id="paymentMethod"
                        name="paymentMethod"
                        value={paymentForm.paymentMethod}
                        onChange={handlePaymentChange}
                        className={`w-full pl-10 pr-8 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${
                          paymentErrors.paymentMethod
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Check">Check</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {paymentErrors.paymentMethod && (
                      <p className="mt-1 text-sm text-red-600">
                        {paymentErrors.paymentMethod}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="inline-flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Payment...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Receipts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Payment History
            </h2>
          </div>

          {receipts.length > 0 ? (
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipts.map((receipt) => (
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
                          {formatCurrency(receipt.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPaymentMethodBadge(receipt.payment_method)}
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
              <p className="text-gray-500">
                No payments have been made for this invoice yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
