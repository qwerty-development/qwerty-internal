"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DebugPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Test database connection
        console.log("Testing database connection...");

        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .limit(10);

        if (invoicesError) {
          console.error("Invoices fetch error:", invoicesError);
          setError(`Invoices fetch failed: ${invoicesError.message}`);
        } else {
          console.log("Invoices data:", invoicesData);
          setInvoices(invoicesData || []);
        }

        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .limit(10);

        if (clientsError) {
          console.error("Clients fetch error:", clientsError);
        } else {
          console.log("Clients data:", clientsData);
          setClients(clientsData || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to load data");
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading debug data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Page</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Invoices ({invoices.length})
          </h2>
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">ID: {invoice.id}</p>
                  <p className="text-sm text-gray-600">
                    Number: {invoice.invoice_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Client ID: {invoice.client_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {invoice.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No invoices found</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Clients ({clients.length})
          </h2>
          {clients.length > 0 ? (
            <div className="space-y-2">
              {clients.map((client) => (
                <div key={client.id} className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">ID: {client.id}</p>
                  <p className="text-sm text-gray-600">Company Name: {client.company_name}</p>
                  <p className="text-sm text-gray-600">
                    Email: {client.company_email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No clients found</p>
          )}
        </div>
      </div>
    </div>
  );
}
