"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface QuotationItem {
  title: string;
  description: string;
  price: number;
}

interface Client {
  id: string;
  company_name: string;
  company_email: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_phone: string;
  address: string;
  mof_number: string;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [clientMode, setClientMode] = useState<"new" | "existing">("new");

  const [formData, setFormData] = useState({
    // Client Information (for new client mode)
    company_name: "",
    company_email: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_phone: "",
    address: "",
    mof_number: "",
    notes: "",

    // Existing client selection
    client_id: "",

    // Quotation Details
    description: "",
    terms_and_conditions: "",
    quotationIssueDate: new Date().toISOString().split("T")[0],
    quotationDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  const [items, setItems] = useState<QuotationItem[]>([
    { title: "", description: "", price: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate total amount from items
  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0), 0);

  // Fetch clients for selection
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select(
            "id, company_name, company_email, contact_person_name, contact_person_email, contact_phone, address, mof_number"
          )
          .order("company_name");

        if (error) {
          console.error("Error fetching clients:", error);
        } else {
          setClients(data || []);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [supabase]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate client fields based on mode
    if (clientMode === "new") {
      if (!formData.company_name.trim()) {
        newErrors.company_name = "Company name is required";
      }

      if (!formData.company_email?.trim()) {
        newErrors.company_email = "Company email is required";
      }
    } else {
      if (!formData.client_id) {
        newErrors.client_id = "Please select a client";
      }
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestData: any = {
        // Quotation data
        description: formData.description.trim(),
        terms_and_conditions:
          formData.terms_and_conditions?.trim() || undefined,
        quotationIssueDate: formData.quotationIssueDate,
        quotationDueDate: formData.quotationDueDate || undefined,
        items: items.filter((item) => item.title.trim()), // Only include items with titles
      };

      // Add client data based on mode
      if (clientMode === "new") {
        // New client mode - include all client data
        requestData.company_name = formData.company_name.trim();
        requestData.company_email = formData.company_email.trim();
        requestData.contact_person_name =
          formData.contact_person_name?.trim() || undefined;
        requestData.contact_person_email =
          formData.contact_person_email?.trim() || undefined;
        requestData.contact_phone = formData.contact_phone?.trim() || undefined;
        requestData.address = formData.address?.trim() || undefined;
        requestData.mof_number = formData.mof_number?.trim() || undefined;
        requestData.notes = formData.notes?.trim() || undefined;
      } else {
        // Existing client mode - include client_id
        requestData.client_id = formData.client_id;
      }

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin/quotations");
      } else {
        setError(result.error || "Failed to create quotation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error creating quotation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/admin/quotations"
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Quotations
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Create New Quotation
        </h1>
        <p className="text-gray-600 mt-2">
          Create a comprehensive quotation with client and invoice details
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md border p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Selection Mode */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Client Selection
            </h2>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="clientMode"
                    value="new"
                    checked={clientMode === "new"}
                    onChange={(e) =>
                      setClientMode(e.target.value as "new" | "existing")
                    }
                    className="mr-2"
                  />
                  <span>Create New Client</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="clientMode"
                    value="existing"
                    checked={clientMode === "existing"}
                    onChange={(e) =>
                      setClientMode(e.target.value as "new" | "existing")
                    }
                    className="mr-2"
                  />
                  <span>Use Existing Client</span>
                </label>
              </div>

              {clientMode === "existing" && (
                <div>
                  <label
                    htmlFor="client_id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Client *
                  </label>
                  <select
                    id="client_id"
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.client_id ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                  {errors.client_id && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.client_id}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Client Information Section - Only show for new client mode */}
          {clientMode === "new" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Client Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="company_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.company_name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter company name"
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.company_name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="company_email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Company Email *
                  </label>
                  <input
                    type="email"
                    id="company_email"
                    name="company_email"
                    value={formData.company_email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.company_email
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter company email"
                  />
                  {errors.company_email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.company_email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact_person_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    id="contact_person_name"
                    name="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact_person_email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Person Email
                  </label>
                  <input
                    type="email"
                    id="contact_person_email"
                    name="contact_person_email"
                    value={formData.contact_person_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact person email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact_phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact phone"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mof_number"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    MOF Number
                  </label>
                  <input
                    type="text"
                    id="mof_number"
                    name="mof_number"
                    value={formData.mof_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter MOF number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>
            </div>
          )}

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

              <div className="md:col-span-2">
                <label
                  htmlFor="terms_and_conditions"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Terms and Conditions
                </label>
                <textarea
                  id="terms_and_conditions"
                  name="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter terms and conditions for this quotation..."
                />
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
              href="/admin/quotations"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Creating..." : "Create Quotation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
