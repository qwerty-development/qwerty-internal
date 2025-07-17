"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-[#01303F] hover:text-[#014a5f] transition-colors"
            >
              QWERTY
            </Link>
            <span className="ml-2 text-gray-600 text-sm font-medium">
              Internal Management
            </span>
          </div>

          <div className="flex space-x-1">
            <Link
              href="/clients"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/clients")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Clients
            </Link>
            <Link
              href="/invoices"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/invoices")
                  ? "bg-[#01303F] text-white shadow-lg"
                  : "text-gray-700 hover:text-[#01303F] hover:bg-gray-50"
              }`}
            >
              Invoices
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
