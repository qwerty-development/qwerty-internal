"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "../../context/DataProvider";
import Link from "next/link";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { clients, addInvoice } = useData();
  const [formData, setFormData] = useState({
    clientId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    description: "",
    totalAmount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = "Please select a client";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = "Please enter a valid amount greater than 0";
    }

    if (!formData.issueDate) {
      newErrors.issueDate = "Issue date is required";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (
      formData.issueDate &&
      formData.dueDate &&
      new Date(formData.dueDate) < new Date(formData.issueDate)
    ) {
      newErrors.dueDate = "Due date must be after issue date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      addInvoice({
        clientId: formData.clientId,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        description: formData.description.trim(),
        totalAmount: parseFloat(formData.totalAmount),
      });

      router.push("/admin/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="clientId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Client *
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.clientId ? "border-red-300" : "border-gray-300"
              }`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
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
                id="issueDate"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.issueDate ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.issueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>
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
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dueDate ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
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
                id="totalAmount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.totalAmount ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.totalAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>
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
