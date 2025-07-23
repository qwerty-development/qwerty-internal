"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { createUpdate } from "@/utils/updateCreation";

const categories = [
  "Announcement",
  "Maintenance",
  "Feature",
  "Bug Fix",
  "General",
];

export default function CreateUpdatePage() {
  const supabase = createClient();
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    update_type: categories[0],
    client_id: "all",
    ticket_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients and tickets
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("id, name")
          .order("name");

        const { data: ticketData, error: ticketError } = await supabase
          .from("tickets")
          .select("id, title")
          .order("created_at", { ascending: false });

        if (clientError) throw new Error(clientError.message);
        if (ticketError) throw new Error(ticketError.message);

        setClients(clientData || []);
        setTickets(ticketData || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.content.trim()) newErrors.content = "Content is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await createUpdate({
        title: formData.title.trim(),
        content: formData.content.trim(),
        update_type: formData.update_type,
        client_id: formData.client_id === "all" ? null : formData.client_id,
        ticket_id: formData.ticket_id || null,
      });

      if (result.success) {
        router.push("/admin");
      } else {
        setError(result.error || "Failed to create update");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
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
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mr-4">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Update</h1>
        <p className="text-gray-600 mt-2">Send an update to customers</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              rows={4}
              value={formData.content}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.content ? "border-red-300" : "border-gray-300"
              }`}
            ></textarea>
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              name="update_type"
              value={formData.update_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-gray-300"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience *
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-gray-300"
            >
              <option value="all">All Customers</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id} className="capitalize">
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach to Ticket (optional)
            </label>
            <select
              name="ticket_id"
              value={formData.ticket_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-gray-300"
            >
              <option value="">None</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id} className="capitalize">
                  {ticket.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Create Update"}
          </button>
        </form>
      </div>
    </div>
  );
} 