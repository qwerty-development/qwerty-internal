"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User as UserIcon } from "lucide-react";

const Navigation = () => {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a
              href="#"
              onClick={handleLogoClick}
              className="text-2xl font-bold text-[#01303F] hover:text-[#014a5f] transition-colors cursor-pointer"
            >
              QWERTY
            </a>
            <span className="ml-2 text-gray-600 text-sm font-medium">
              Internal Management
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {userLoaded && user?.role === "admin" && (
              <>
                <Link
                  href="/admin/clients"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/admin/clients")
                      ? "bg-[#01303F] text-white shadow-lg"
                      : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
                  }`}
                >
                  Clients
                </Link>
                <Link
                  href="/admin/invoices"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/admin/invoices")
                      ? "bg-[#01303F] text-white shadow-lg"
                      : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
                  }`}
                >
                  Invoices
                </Link>
                <Link
                  href="/admin/quotations"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/admin/quotations")
                      ? "bg-[#01303F] text-white shadow-lg"
                      : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
                  }`}
                >
                  Quotations
                </Link>
                <Link
                  href="/admin/tickets"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/admin/tickets")
                      ? "bg-[#01303F] text-white shadow-lg"
                      : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
                  }`}
                >
                  Tickets
                </Link>
              </>
            )}
            {/* User Avatar/Profile */}
            {user && (
              <div className="relative ml-4">
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
