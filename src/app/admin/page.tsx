"use client";

import { useData } from "./context/DataProvider";
import {
  User,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Plus,
  Users,
  Zap,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const { clients, invoices, receipts } = useData();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
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

  const totalInvoices = invoices.length;
  const totalReceipts = receipts.length;
  const totalClients = clients.length;
  const totalOutstanding = clients.reduce(
    (sum, client) => sum + client.regularBalance,
    0
  );
  const totalPaid = clients.reduce((sum, client) => sum + client.paidAmount, 0);

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
                  <div className="text-lg font-semibold text-gray-900">{user.name}</div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-[#01303F] to-[#014a5f] rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Clients
                </p>
                <p className="text-3xl font-bold text-[#01303F]">
                  {totalClients}
                </p>
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
                <p className="text-3xl font-bold text-[#01303F]">
                  {totalInvoices}
                </p>
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
                <p className="text-3xl font-bold text-[#01303F]">
                  ${totalOutstanding.toFixed(2)}
                </p>
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
                <p className="text-3xl font-bold text-[#01303F]">
                  ${totalPaid.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-br from-[#01303F] to-[#014a5f] rounded-lg mr-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#01303F]">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-4">
              <Link
                href="/admin/clients/new"
                className="flex items-center p-4 bg-gradient-to-r from-[#01303F] to-[#014a5f] text-white rounded-xl hover:from-[#014a5f] hover:to-[#01303F] transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="p-2 bg-white/20 rounded-lg mr-4">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Create New Client</p>
                  <p className="text-sm text-blue-100">
                    Add a new client to your system
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/invoices/new"
                className="flex items-center p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-emerald-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="p-2 bg-white/20 rounded-lg mr-4">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Create New Invoice</p>
                  <p className="text-sm text-emerald-100">
                    Generate an invoice for a client
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/clients"
                className="flex items-center p-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="p-2 bg-white/20 rounded-lg mr-4">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">View All Clients</p>
                  <p className="text-sm text-slate-200">
                    Manage your client relationships
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/invoices"
                className="flex items-center p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="p-2 bg-white/20 rounded-lg mr-4">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">View All Invoices</p>
                  <p className="text-sm text-blue-200">
                    Track payments and balances
                  </p>
                </div>
              </Link>
            </div>
          </div>

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
                <span className="text-lg font-bold text-[#01303F]">
                  {totalReceipts}
                </span>
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
                <span className="text-lg font-bold text-[#01303F]">
                  {invoices.filter((inv) => inv.status === "Paid").length}
                </span>
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
                <span className="text-lg font-bold text-[#01303F]">
                  {invoices.filter((inv: { status: string; }) => inv.status === "Unpaid").length}
                </span>
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
                <span className="text-lg font-bold text-[#01303F]">
                  {
                    invoices.filter((inv) => inv.status === "Partially Paid")
                      .length
                  }
                </span>
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
              Your comprehensive solution for managing clients, invoices, and
              financial tracking. Everything is designed to help you stay
              organized and focused on growing your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}