"use client";

import { useData } from "./context/DataProvider";
import Link from "next/link";

export default function HomePage() {
  const { clients, invoices, receipts } = useData();

  const totalInvoices = invoices.length;
  const totalReceipts = receipts.length;
  const totalClients = clients.length;
  const totalOutstanding = clients.reduce(
    (sum, client) => sum + client.regularBalance,
    0
  );
  const totalPaid = clients.reduce((sum, client) => sum + client.paidAmount, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to QWERTY Internal Management
        </h1>
        <p className="text-xl text-gray-600">
          Manage your clients, invoices, and financial tracking in one place
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalClients}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Invoices
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalInvoices}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Outstanding Balance
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalOutstanding.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/clients/new"
              className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            >
              + Create New Client
            </Link>
            <Link
              href="/invoices/new"
              className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
            >
              + Create New Invoice
            </Link>
            <Link
              href="/clients"
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
            >
              View All Clients
            </Link>
            <Link
              href="/invoices"
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
            >
              View All Invoices
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p>• {totalReceipts} payment receipts processed</p>
              <p>
                • {invoices.filter((inv) => inv.status === "Paid").length}{" "}
                invoices fully paid
              </p>
              <p>
                • {invoices.filter((inv) => inv.status === "Unpaid").length}{" "}
                invoices pending payment
              </p>
              <p>
                •{" "}
                {
                  invoices.filter((inv) => inv.status === "Partially Paid")
                    .length
                }{" "}
                invoices partially paid
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
