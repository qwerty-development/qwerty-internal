"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientUser } from "@/utils/clientCreation";

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    notes: "",
    company_name: "",
    company_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedPassword(null);
    setShowPassword(false);

    if (!form.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!form.contact_email.trim()) {
      setError("Email is required for client login");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.contact_email.trim())) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const result = await createClientUser({
        name: form.name,
        email: form.contact_email,
        phone: form.contact_phone || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        company_name: form.company_name || undefined,
        company_email: form.company_email || undefined,
      });

      if (result.success) {
        setSuccess(result.message);
        setGeneratedPassword(result.password);
        setShowPassword(true);
        setForm({
          name: "",
          contact_email: "",
          contact_phone: "",
          address: "",
          notes: "",
          company_name: "",
          company_email: "",
        });
      } else {
        setError(result.error || "Failed to create client");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred");
    }

    setLoading(false);
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        setSuccess("Password copied to clipboard!");
        setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
        setError("Failed to copy password");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg space-y-6 border border-gray-100"
      >
        <h1 className="text-2xl font-bold text-qwerty text-center mb-2">
          Add New Client
        </h1>
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">
            Name *
          </label>
          <input
            name="name"
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.name}
            onChange={handleChange}
            placeholder="Client name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">
            Contact Email *
          </label>
          <input
            name="contact_email"
            type="email"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.contact_email}
            onChange={handleChange}
            placeholder="Email address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">
            Company Name
          </label>
          <input
            name="company_name"
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.company_name}
            onChange={handleChange}
            placeholder="Company name (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">
            Company Email
          </label>
          <input
            name="company_email"
            type="email"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.company_email}
            onChange={handleChange}
            placeholder="Company email (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">
            Contact Phone
          </label>
          <input
            name="contact_phone"
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.contact_phone}
            onChange={handleChange}
            placeholder="Phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">
            Address
          </label>
          <input
            name="address"
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400 resize-none"
            value={form.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        {/* Password Display Section */}
        {showPassword && generatedPassword && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-900">
                Generated Password
              </h3>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-300">
              <code className="text-sm font-mono text-blue-900 break-all">
                {generatedPassword}
              </code>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Share this password with the client. They can use their email and
              this password to log in.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-qwerty text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Creating..." : "Add Client"}
          </button>
          
          {showPassword && (
            <button
              type="button"
              onClick={() => router.push('/admin/clients')}
              className="w-full py-4 rounded-xl bg-gray-100 text-gray-700 font-semibold border border-gray-200 hover:bg-gray-200 hover:scale-[1.02] transition-all duration-300"
            >
              Back to Clients
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
