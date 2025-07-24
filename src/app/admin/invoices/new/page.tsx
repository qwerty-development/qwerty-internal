"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface InvoiceItem {
  title: string;
  description: string;
  price: number;
}

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
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { title: "", description: "", price: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total amount from items
  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = "Please select a client";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
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

    // Validate items
    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    items.forEach((item, index) => {
      if (!item.title.trim()) {
        newErrors[`item_${index}_title`] = "Item title is required";
      }
      if (item.price < 0) {
        newErrors[`item_${index}_price`] = "Price cannot be negative";
      }
    });

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
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: formData.client_id,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          description: formData.description.trim(),
          items: items.filter((item) => item.title.trim()), // Only include items with titles
        }),
      });

      const result = await response.json();

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

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });

    // Clear item errors
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: "" }));
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, { title: "", description: "", price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));

      // Clear related errors
      const newErrors = { ...errors };
      delete newErrors[`item_${index}_title`];
      delete newErrors[`item_${index}_price`];
      setErrors(newErrors);
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

  if (error && !clients.length) {
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

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Invoice Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Item
              </button>
            </div>

            {errors.items && (
              <p className="mb-3 text-sm text-red-600">{errors.items}</p>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Item #{index + 1}
                    </h4>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          handleItemChange(index, "title", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                          errors[`item_${index}_title`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter item title"
                      />
                      {errors[`item_${index}_title`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_title`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Price *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          step="0.01"
                          min="0"
                          className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                            errors[`item_${index}_price`]
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors[`item_${index}_price`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_price`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Optional item description"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount Display */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total Amount:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
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
