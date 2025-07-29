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
  TrendingUp,
  Activity,
  Calendar,
  Receipt,
  ChevronDown,
  ChevronRight,
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

  const toggleSection = (sectionName: string) => {
    const newExpandedSections = new Set(expandedSections);
    if (newExpandedSections.has(sectionName)) {
      // If clicking the same section, close it
      newExpandedSections.delete(sectionName);
    } else {
      // If clicking a different section, close all others and open this one
      newExpandedSections.clear();
      newExpandedSections.add(sectionName);
    }
    setExpandedSections(newExpandedSections);
  };

  // Quick action cards data
  const quickActions = [
    {
      title: "New Client",
      href: "/admin/clients/new",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "New Invoice",
      href: "/admin/invoices/new",
      icon: FileText,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "New Quotation",
      href: "/admin/quotations/new",
      icon: Quote,
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      title: "Branding",
      href: "/admin/branding",
      icon: Palette,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#01303F] via-[#014a5f] to-[#01303F]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">

            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              <img src="/white-logo-big.png" alt="QWERTY" className="h-32 md:h-60  mx-auto mb-4" />
              <span className="block text-3xl md:text-4xl font-light text-blue-100 mt-2">
                Internal Management
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8">
              Streamline your client relationships and financial tracking with
              our comprehensive management system. Everything you need, all in
              one place.
            </p>
            {lastUpdated && (
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl">
                <span className="text-blue-100">Updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu - Half in blue section, half out */}
      <div className="relative -mt-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Clients & Relationships Button */}
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
                <button
                  onClick={() => toggleSection('clients')}
                  className="w-full flex items-center justify-center p-6 bg-transparent border border-blue-200/50 text-blue-700 font-semibold hover:bg-blue-50/50 transition-all duration-200 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6" />
                    <span className="text-base">Clients & Relationships</span>
                  </div>
                  {expandedSections.has('clients') ? (
                    <ChevronDown className="w-5 h-5 ml-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 ml-2" />
                  )}
                </button>
              </div>
              {expandedSections.has('clients') && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-4 space-y-2">
                  <Link
                    href="/admin/clients"
                    className="flex items-center p-3 hover:bg-blue-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">All Clients</span>
                  </Link>
                  <Link
                    href="/admin/clients/new"
                    className="flex items-center p-3 hover:bg-blue-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">New Client</span>
                  </Link>
                  <Link
                    href="/admin/updates"
                    className="flex items-center p-3 hover:bg-blue-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                      <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">Updates</span>
                  </Link>
                  <Link
                    href="/admin/tickets"
                    className="flex items-center p-3 hover:bg-blue-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">Tickets</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Financial Management Button */}
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
                <button
                  onClick={() => toggleSection('financial')}
                  className="w-full flex items-center justify-center p-6 bg-transparent border border-emerald-200/50 text-emerald-700 font-semibold hover:bg-emerald-50/50 transition-all duration-200 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-base">Financial Management</span>
                  </div>
                  {expandedSections.has('financial') ? (
                    <ChevronDown className="w-5 h-5 ml-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 ml-2" />
                  )}
                </button>
              </div>
              {expandedSections.has('financial') && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-4 space-y-2">
                  <Link
                    href="/admin/invoices"
                    className="flex items-center p-3 hover:bg-emerald-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">Invoices</span>
                  </Link>
                  <Link
                    href="/admin/invoices/new"
                    className="flex items-center p-3 hover:bg-emerald-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">New Invoice</span>
                  </Link>
                  <Link
                    href="/admin/quotations"
                    className="flex items-center p-3 hover:bg-emerald-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                      <Quote className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">Quotations</span>
                  </Link>
                  <Link
                    href="/admin/quotations/new"
                    className="flex items-center p-3 hover:bg-emerald-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                      <Quote className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">New Quotation</span>
                  </Link>
                  <Link
                    href="/admin/receipts"
                    className="flex items-center p-3 hover:bg-emerald-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">Receipts</span>
                  </Link>
                  <Link
                    href="/admin/subscriptions"
                    className="flex items-center p-3 hover:bg-emerald-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">Subscriptions</span>
                  </Link>
                </div>
              )}
            </div>

            {/* System & Settings Button */}
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
                <button
                  onClick={() => toggleSection('settings')}
                  className="w-full flex items-center justify-center p-6 bg-transparent border border-purple-200/50 text-purple-700 font-semibold hover:bg-purple-50/50 transition-all duration-200 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-base">System & Settings</span>
                  </div>
                  {expandedSections.has('settings') ? (
                    <ChevronDown className="w-5 h-5 ml-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 ml-2" />
                  )}
                </button>
              </div>
              {expandedSections.has('settings') && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-4 space-y-2">
                  <Link
                    href="/admin/branding"
                    className="flex items-center p-3 hover:bg-purple-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-purple-100 rounded-lg mr-3">
                      <Palette className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700">Branding Settings</span>
                  </Link>
                  <Link
                    href="/admin/debug"
                    className="flex items-center p-3 hover:bg-purple-50/50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-1.5 bg-purple-100 rounded-lg mr-3">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700">Debug</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`group relative p-4 ${action.bgColor} ${action.borderColor} border rounded-xl hover:shadow-md transition-all duration-200 transform hover:scale-105`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 bg-gradient-to-br ${action.color} rounded-lg`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">{action.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Metrics Section */}
        <div className="space-y-8">
          {/* Key Metrics - Full Width */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#01303F]">Key Metrics</h2>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="p-2 bg-blue-500 rounded-lg w-fit mx-auto mb-2">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                {loading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-[#01303F]">{stats.totalClients}</p>
                )}
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <div className="p-2 bg-emerald-500 rounded-lg w-fit mx-auto mb-2">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Invoices</p>
                {loading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-[#01303F]">{stats.totalInvoices}</p>
                )}
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div className="p-2 bg-amber-500 rounded-lg w-fit mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                {loading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-lg font-bold text-[#01303F]">${stats.totalOutstanding.toFixed(0)}</p>
                )}
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="p-2 bg-purple-500 rounded-lg w-fit mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Collected</p>
                {loading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-lg font-bold text-[#01303F]">${stats.totalCollected.toFixed(0)}</p>
                )}
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#01303F]">System Overview</h2>
              <div className="p-2 bg-green-50 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Financial Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Financial Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Paid Invoices</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.fullyPaidInvoices}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-gray-700">Pending</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.pendingPayments}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">Partial</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.partiallyPaid}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quotations */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quotations</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                    <div className="flex items-center space-x-2">
                      <Quote className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm text-gray-700">Draft</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.draftQuotations}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-2">
                      <Quote className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">Sent</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.sentQuotations}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Approved</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.approvedQuotations}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Support & Receipts */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Support & Receipts</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700">Tickets</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#01303F]">{stats.totalTickets}</span>
                        {stats.pendingTickets > 0 && (
                          <p className="text-xs text-orange-600">{stats.pendingTickets} pending</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">Receipts</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.totalReceipts}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm text-gray-700">Converted</span>
                    </div>
                    {loading ? (
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm font-bold text-[#01303F]">{stats.convertedQuotations}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-[#01303F] to-[#014a5f] rounded-2xl p-6 text-white">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-3">Welcome to QWERTY Internal Management</h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Your comprehensive solution for managing clients, invoices, quotations, and financial tracking. 
                Everything is designed to help you stay organized and focused on growing your business.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
