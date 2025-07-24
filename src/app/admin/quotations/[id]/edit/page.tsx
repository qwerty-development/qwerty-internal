"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface QuotationItem {
  id?: string;
  position: number;
  title: string;
  description: string;
  price: number;
}

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_contact_email: string;
  client_contact_phone: string;
  client_address: string;
  client_notes: string;
  description: string;
  total_amount: number;
  issue_date: string;
  due_date: string | null;
  quotation_issue_date: string;
  quotation_due_date: string | null;
  status: string;
  uses_items: boolean;
}

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Client Information
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientContactEmail: "",
    clientContactPhone: "",
    clientAddress: "",
    clientNotes: "",

    // Quotation Details
    description: "",
    quotationIssueDate: "",
    quotationDueDate: "",
  });

  const [items, setItems] = useState<QuotationItem[]>([
    { position: 1, title: "", description: "", price: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate total amount from items
  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0), 0);

  // Fetch quotation data
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`/api/quotations/${quotationId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch quotation");
        }
        const quotation: Quotation = await response.json();

        setFormData({
          clientName: quotation.client_name || "",
          clientEmail: quotation.client_email || "",
          clientPhone: quotation.client_phone || "",
          clientContactEmail: quotation.client_contact_email || "",
          clientContactPhone: quotation.client_contact_phone || "",
          clientAddress: quotation.client_address || "",
          clientNotes: quotation.client_notes || "",
          description: quotation.description || "",
          quotationIssueDate:
            quotation.quotation_issue_date || quotation.issue_date || "",
          quotationDueDate:
            quotation.quotation_due_date || quotation.due_date || "",
        });

        // Fetch items if quotation uses items
        if (quotation.uses_items) {
          const itemsResponse = await fetch(
            `/api/quotations/${quotationId}/items`
          );
          if (itemsResponse.ok) {
            const fetchedItems = await itemsResponse.json();
            if (Array.isArray(fetchedItems) && fetchedItems.length > 0) {
              setItems(
                fetchedItems.map((item: any) => ({
                  id: item.id,
                  position: item.position,
                  title: item.title,
                  description: item.description || "",
                  price: item.price,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error("Error fetching quotation:", err);
        setError("Failed to load quotation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate client fields
    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    }

    if (!formData.clientEmail?.trim() && !formData.clientContactEmail?.trim()) {
      newErrors.clientEmail = "At least one email address is required";
    }

    if (!formData.clientPhone?.trim() && !formData.clientContactPhone?.trim()) {
      newErrors.clientPhone = "At least one phone number is required";
    }

    // Validate quotation fields
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.quotationIssueDate) {
      newErrors.quotationIssueDate = "Issue date is required";
    }

    if (
      formData.quotationIssueDate &&
      formData.quotationDueDate &&
      new Date(formData.quotationDueDate) <
        new Date(formData.quotationIssueDate)
    ) {
      newErrors.quotationDueDate = "Due date must be after issue date";
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItem,
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
    setItems((prev) => [
      ...prev,
      { position: prev.length + 1, title: "", description: "", price: 0 },
    ]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update quotation details
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Client data
          clientName: formData.clientName.trim(),
          clientEmail: formData.clientEmail?.trim() || undefined,
          clientPhone: formData.clientPhone?.trim() || undefined,
          clientContactEmail: formData.clientContactEmail?.trim() || undefined,
          clientContactPhone: formData.clientContactPhone?.trim() || undefined,
          clientAddress: formData.clientAddress?.trim() || undefined,
          clientNotes: formData.clientNotes?.trim() || undefined,

          // Quotation data
          description: formData.description.trim(),
          quotationIssueDate: formData.quotationIssueDate,
          quotationDueDate: formData.quotationDueDate || undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update quotation");
      }

      // Update items
      const itemsToSave = items.filter((item) => item.title.trim());
      const itemsResponse = await fetch(
        `/api/quotations/${quotationId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemsToSave),
        }
      );

      if (!itemsResponse.ok) {
        const result = await itemsResponse.json();
        throw new Error(result.error || "Failed to update items");
      }

      router.push(`/admin/quotations/${quotationId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      console.error("Error updating quotation:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Quotation
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/admin/quotations"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Quotations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/admin/quotations/${quotationId}`}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Quotation
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Quotation</h1>
        <p className="text-gray-600 mt-2">Update quotation details and items</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Client Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Client Name *
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.clientName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter client name"
                />
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Primary Email
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.clientEmail ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="primary@email.com"
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientEmail}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientContactEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contact Email
                </label>
                <input
                  type="email"
                  id="clientContactEmail"
                  name="clientContactEmail"
                  value={formData.clientContactEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="clientPhone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Primary Phone
                </label>
                <input
                  type="tel"
                  id="clientPhone"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.clientPhone ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.clientPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientPhone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientContactPhone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="clientContactPhone"
                  name="clientContactPhone"
                  value={formData.clientContactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 987-6543"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="clientAddress"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Address
                </label>
                <textarea
                  id="clientAddress"
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client address"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="clientNotes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notes
                </label>
                <textarea
                  id="clientNotes"
                  name="clientNotes"
                  value={formData.clientNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about the client"
                />
              </div>
            </div>
          </div>

          {/* Quotation Details Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quotation Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="quotationIssueDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Issue Date *
                </label>
                <input
                  type="date"
                  id="quotationIssueDate"
                  name="quotationIssueDate"
                  value={formData.quotationIssueDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quotationIssueDate
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {errors.quotationIssueDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.quotationIssueDate}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="quotationDueDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  id="quotationDueDate"
                  name="quotationDueDate"
                  value={formData.quotationDueDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quotationDueDate
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {errors.quotationDueDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.quotationDueDate}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
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
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Describe the services or products being quoted..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quotation Items Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quotation Items
              </h2>
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

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              href={`/admin/quotations/${quotationId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
