"use client";

import {
  User,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Plus,
  Users,
  Zap,
  BarChart3,
  RefreshCw,
  Quote,
  Bell,
  Palette,
  CreditCard,
} from "lucide-react";
import AdminNavigation from "@/components/AdminNavigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Dashboard statistics state
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    totalOutstanding: 0,
    totalCollected: 0,
    totalReceipts: 0,
    fullyPaidInvoices: 0,
    pendingPayments: 0,
    partiallyPaid: 0,
    totalTickets: 0,
    pendingTickets: 0,
    unviewedTickets: 0,
    totalQuotations: 0,
    draftQuotations: 0,
    sentQuotations: 0,
    approvedQuotations: 0,
    rejectedQuotations: 0,
    convertedQuotations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/signin");
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("id, name, avatar_url, role")
        .eq("id", session.user.id)
        .single();
      if (!error && data) {
        setUser({ ...data, email: session.user.email });
        if (data.role !== "admin") {
          router.replace("/portal");
        }
      } else {
        router.replace("/signin");
      }
    };
    checkAuth();
  }, [router]);

  // Function to fetch dashboard statistics
  const fetchDashboardStats = async () => {
    setRefreshing(true);
    try {
      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("regular_balance, paid_amount");

      // Fetch all invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("status, total_amount, amount_paid, balance_due");

      // Fetch all receipts
      const { data: receipts, error: receiptsError } = await supabase
        .from("receipts")
        .select("amount");

      // Fetch all quotations
      const { data: quotations, error: quotationsError } = await supabase
        .from("quotations")
        .select("status, total_amount, is_converted");

      if (clientsError || invoicesError || receiptsError || quotationsError) {
        console.error("Error fetching dashboard data:", {
          clientsError,
          invoicesError,
          receiptsError,
          quotationsError,
        });
        return;
      }

      // Calculate statistics
      const totalClients = clients?.length || 0;
      const totalInvoices = invoices?.length || 0;
      const totalReceipts = receipts?.length || 0;
      const totalQuotations = quotations?.length || 0;

      // Calculate outstanding amount (sum of all client regular_balance)
      const totalOutstanding =
        clients?.reduce(
          (sum, client) => sum + (client.regular_balance || 0),
          0
        ) || 0;

      // Calculate total collected (sum of all client paid_amount)
      const totalCollected =
        clients?.reduce((sum, client) => sum + (client.paid_amount || 0), 0) ||
        0;

      // Calculate invoice status counts
      const fullyPaidInvoices =
        invoices?.filter((inv) => inv.status === "paid").length || 0;
      const pendingPayments =
        invoices?.filter((inv) => inv.status === "unpaid").length || 0;
      const partiallyPaid =
        invoices?.filter((inv) => inv.status === "partially_paid").length || 0;

      // Calculate quotation status counts
      const draftQuotations =
        quotations?.filter((q) => q.status === "Draft").length || 0;
      const sentQuotations =
        quotations?.filter((q) => q.status === "Sent").length || 0;
      const approvedQuotations =
        quotations?.filter((q) => q.status === "Approved").length || 0;
      const rejectedQuotations =
        quotations?.filter((q) => q.status === "Rejected").length || 0;
      const convertedQuotations =
        quotations?.filter((q) => q.is_converted === true).length || 0;

      // Fetch ticket statistics
      const { data: tickets } = await supabase
        .from("tickets")
        .select("status, viewed");

      const totalTickets = tickets?.length || 0;
      const pendingTickets =
        tickets?.filter((t) => t.status === "pending").length || 0;
      const unviewedTickets =
        tickets?.filter((t) => t.viewed === false).length || 0;

      setStats({
        totalClients,
        totalInvoices,
        totalOutstanding,
        totalCollected,
        totalReceipts,
        fullyPaidInvoices,
        pendingPayments,
        partiallyPaid,
        totalTickets,
        pendingTickets,
        unviewedTickets,
        totalQuotations,
        draftQuotations,
        sentQuotations,
        approvedQuotations,
        rejectedQuotations,
        convertedQuotations,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle manual refresh
  const handleRefresh = () => {
    fetchDashboardStats();
  };

  // Fetch dashboard statistics on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, [supabase]);

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* User Avatar/Profile */}
      {user && (
        <div className="absolute top-4 right-8 z-50">
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setPanelOpen((open) => !open)}
              aria-label="Open user panel"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-blue-900">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </span>
              )}
            </button>
            {panelOpen && (
              <div
                ref={panelRef}
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-6 z-50 animate-fade-in"
              >
                <div className="flex flex-col items-center mb-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="avatar"
                      className="w-16 h-16 rounded-full object-cover mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-900 mb-2">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="text-lg font-semibold text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#01303F] via-[#014a5f] to-[#01303F]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <FileText className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              QWERTY
              <span className="block text-3xl md:text-4xl font-light text-blue-100 mt-2">
                Internal Management
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Streamline your client relationships and financial tracking with
              our comprehensive management system. Everything you need, all in
              one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/clients"
                className="inline-flex items-center px-8 py-4 bg-white text-[#01303F] font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Users className="w-5 h-5 mr-2" />
                Clients
              </Link>
              <Link
                href="/admin/invoices"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:scale-105"
              >
                <FileText className="w-5 h-5 mr-2" />
                Invoices
              </Link>
              <Link
                href="/admin/subscriptions"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:scale-105"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Subscriptions
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-5 h-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-[#01303F] to-[#014a5f] rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Clients
                </p>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-[#01303F]">
                    {stats.totalClients}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Invoices
                </p>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-[#01303F]">
                    {stats.totalInvoices}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-[#01303F]">
                    ${stats.totalOutstanding.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tickets</p>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[#01303F]">
                      {stats.totalTickets}
                    </p>
                    {stats.pendingTickets > 0 && (
                      <p className="text-sm text-orange-600 font-medium">
                        {stats.pendingTickets} pending
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Collected
                </p>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-[#01303F]">
                    ${stats.totalCollected.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Quote className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quotations</p>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[#01303F]">
                      {stats.totalQuotations}
                    </p>
                    {stats.sentQuotations > 0 && (
                      <p className="text-sm text-blue-600 font-medium">
                        {stats.sentQuotations} sent
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Navigation Menu */}
          <AdminNavigation />

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mr-3">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#01303F]">
                System Overview
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-500 rounded-lg mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Payment Receipts
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.totalReceipts}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Fully Paid Invoices
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.fullyPaidInvoices}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-500 rounded-lg mr-3">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Pending Payments
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.pendingPayments}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg mr-3">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Partially Paid
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.partiallyPaid}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                <div className="flex items-center">
                  <div className="p-2 bg-cyan-500 rounded-lg mr-3">
                    <Quote className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Draft Quotations
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.draftQuotations}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg mr-3">
                    <Quote className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Sent Quotations
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.sentQuotations}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Approved Quotations
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.approvedQuotations}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg mr-3">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Converted Quotations
                  </span>
                </div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-[#01303F]">
                    {stats.convertedQuotations}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#01303F] to-[#014a5f] rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Welcome to QWERTY Internal Management
            </h3>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Your comprehensive solution for managing clients, invoices,
              quotations, and financial tracking. Everything is designed to help
              you stay organized and focused on growing your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
