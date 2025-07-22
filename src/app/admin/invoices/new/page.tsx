"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createInvoice } from "@/utils/invoiceCreation";
import Link from "next/link";

export default function CreateInvoicePage() {
  const router = useRouter();
  const supabase = createClient();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    description: "",
    total_amount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = "Please select a client";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = "Please enter a valid amount greater than 0";
    }

    if (!formData.issue_date) {
      newErrors.issue_date = "Issue date is required";
    }

    if (!formData.due_date) {
      newErrors.due_date = "Due date is required";
    }

    if (
      formData.issue_date &&
      formData.due_date &&
      new Date(formData.due_date) < new Date(formData.issue_date)
    ) {
      newErrors.due_date = "Due date must be after issue date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch clients from database
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, name")
          .order("name");

        if (error) {
          setError(error.message);
        } else {
          setClients(data || []);
        }
      } catch (err) {
        setError("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createInvoice({
        client_id: formData.client_id,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        description: formData.description.trim(),
        total_amount: parseFloat(formData.total_amount),
      });

      if (result.success) {
        router.push("/admin/invoices");
      } else {
        setError(result.error || "Failed to create invoice");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Clients
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/admin/invoices"
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Invoices
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600 mt-2">
          Generate a new invoice for a client
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md border p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="clientId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Client *
            </label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.client_id ? "border-red-300" : "border-gray-300"
              }`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="issueDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Issue Date *
              </label>
              <input
                type="date"
                id="issue_date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.issue_date ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.issue_date && (
                <p className="mt-1 text-sm text-red-600">{errors.issue_date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Due Date *
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.due_date ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter description of services or items"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="totalAmount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Total Amount *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                $
              </span>
              <input
                type="number"
                id="total_amount"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.total_amount ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.total_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              href="/admin/invoices"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
