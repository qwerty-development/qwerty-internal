"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              QWERTY
            </Link>
            <span className="ml-2 text-gray-500 text-sm">
              Internal Management
            </span>
          </div>

          <div className="flex space-x-8">
            <Link
              href="/clients"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/clients")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Clients
            </Link>
            <Link
              href="/invoices"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/invoices")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
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
