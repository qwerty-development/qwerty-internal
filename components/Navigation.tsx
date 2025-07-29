"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User as UserIcon, Menu, X, LogOut, Settings, RefreshCw } from "lucide-react";

const Navigation = () => {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hide navigation on home page
  if (pathname === "/") {
    return null;
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setUserLoaded(true);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("id, name, avatar_url, role")
        .eq("id", session.user.id)
        .single();
      if (!error && data) setUser(data);
      setUserLoaded(true);
    };
    getUser();
  }, []);

  // Close panel on outside click
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

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/portal";
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - you can add actual refresh logic here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderAdminNavLinks = () => {
    return (
      <>
        {/* Client Management Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Client Management
          </h3>
          <div className="space-y-1">
            <Link
              href="/admin/clients"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/admin/clients")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Clients
            </Link>
            <Link
              href="/admin/updates"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/admin/updates")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Updates
            </Link>
            <Link
              href="/admin/tickets"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/admin/tickets")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Tickets
            </Link>
          </div>
        </div>

        {/* Financial Management Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Financial Management
          </h3>
          <div className="space-y-1">
            <Link
              href="/admin/invoices"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/admin/invoices")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Invoices
            </Link>
            <Link
              href="/admin/quotations"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/admin/quotations")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Quotations
            </Link>
            <Link
              href="/admin/receipts"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/admin/receipts")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Receipts
            </Link>
            <Link
              href="/admin/subscriptions"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/admin/subscriptions")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Subscriptions
            </Link>
          </div>
        </div>
      </>
    );
  };

  const renderClientNavLinks = () => {
    return (
      <>
        {/* Main Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Main
          </h3>
          <div className="space-y-1">
            <Link
              href="/portal"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/portal")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/portal/updates"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/portal/updates")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Updates
            </Link>
            <Link
              href="/portal/tickets"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/portal/tickets")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Tickets
            </Link>
          </div>
        </div>
      </>
    );
  };

  const renderDesktopNavLinks = () => {
    if (!userLoaded) return null;

    if (user?.role === "admin") {
      return (
        <div className="flex items-center space-x-1">
          <Link
            href="/admin/clients"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/admin/clients")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Clients
          </Link>
          <Link
            href="/admin/invoices"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/admin/invoices")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Invoices
          </Link>
          <Link
            href="/admin/quotations"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/admin/quotations")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Quotations
          </Link>
          <Link
            href="/admin/receipts"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/admin/receipts")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Receipts
          </Link>
          <Link
            href="/admin/tickets"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/admin/tickets")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Tickets
          </Link>
          <Link
            href="/admin/updates"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/admin/updates")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Updates
          </Link>
          <Link
            href="/admin/subscriptions"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/admin/subscriptions")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Subscriptions
          </Link>
        </div>
      );
    }

    if (user?.role === "client") {
      return (
        <div className="flex items-center space-x-1">
          <Link
            href="/portal"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/portal")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Home
          </Link>
          <Link
            href="/portal/updates"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/portal/updates")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Updates
          </Link>
          <Link
            href="/portal/tickets"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/portal/tickets")
                ? "bg-[#01303F] text-white shadow-lg"
                : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
            }`}
          >
            Tickets
          </Link>
        </div>
      );
    }

    return null;
  };

  const renderProfileSection = () => {
    if (!user) return null;

    return (
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
          Profile
        </h3>
        <div className="space-y-1">
          <div className="px-3 py-2 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    );
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <a
              href="#"
              onClick={handleLogoClick}
              className="flex items-center transition-colors cursor-pointer"
            >
              <img src="/blue-q.png" alt="QWERTY" className="h-8 md:h-10" />
            </a>
            <span className="ml-2 text-gray-600 text-xs md:text-sm font-medium hidden sm:block">
              Internal Management
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {renderDesktopNavLinks()}
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-gray-700 hover:text-[#01303F] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            
            {/* Desktop Profile */}
            {user && (
              <div className="relative ml-2">
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
                    <UserIcon className="w-6 h-6 text-blue-900" />
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
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                          <UserIcon className="w-10 h-10 text-blue-900" />
                        </div>
                      )}
                      <div className="text-lg font-semibold text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.role}</div>
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
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-[#01303F] hover:bg-gray-50 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4">
              {userLoaded && user?.role === "admin" && renderAdminNavLinks()}
              {userLoaded && user?.role === "client" && renderClientNavLinks()}
              {renderProfileSection()}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
