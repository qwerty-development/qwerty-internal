"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { updateClientUser } from "@/utils/clientUpdate";
import Link from "next/link";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const clientId = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_phone: "",
    address: "",
    mof_number: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();

        if (clientError) {
          setError("Client not found");
          setLoading(false);
          return;
        }

        setClient(clientData);
        setFormData({
          company_name: clientData.company_name || "",
          company_email: clientData.company_email || "",
          contact_person_name: clientData.contact_person_name || "",
          contact_person_email: clientData.contact_person_email || "",
          contact_phone: clientData.contact_phone || "",
          address: clientData.address || "",
          mof_number: clientData.mof_number || "",
          notes: clientData.notes || "",
        });
      } catch (err) {
        setError("Failed to load client data");
      }

      setLoading(false);
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, supabase]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }

    if (
      formData.company_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)
    ) {
      newErrors.company_email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateClientUser(clientId, {
        company_name: formData.company_name.trim(),
        company_email: formData.company_email.trim() || undefined,
        contact_person_name: formData.contact_person_name.trim() || undefined,
        contact_person_email: formData.contact_person_email.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        mof_number: formData.mof_number.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      if (result.success) {
        router.push(`/admin/clients/${clientId}`);
      } else {
        setError(result.error || "Failed to update client");
        setIsSubmitting(false);
      }

      router.push(`/admin/clients/${clientId}`);
    } catch (error) {
      console.error("Error updating client:", error);
      setError("Failed to update client");
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Client Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The client you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/clients"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/admin/clients/${clientId}`}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Client Details
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
        <p className="text-gray-600 mt-2">Update client information</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.company_name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="contact_phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label
              htmlFor="company_email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Company Email
            </label>
            <input
              type="email"
              id="company_email"
              name="company_email"
              value={formData.company_email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.company_email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter company email address"
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter contact person email"
            />
          </div>

          <div>
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
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter address"
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter MOF registration number"
            />
          </div>

          <div>
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
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter additional notes"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              href={`/admin/clients/${clientId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Updating..." : "Update Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
