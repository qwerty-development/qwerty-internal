"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function NewClientPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    regular_balance: "",
    paid_amount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (!form.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("clients")
      .insert([
        {
          name: form.name,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          address: form.address || null,
          regular_balance: form.regular_balance ? Number(form.regular_balance) : 0,
          paid_amount: form.paid_amount ? Number(form.paid_amount) : 0,
          notes: form.notes || null,
        },
      ]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Client created successfully!");
      setForm({
        name: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        regular_balance: "",
        paid_amount: "",
        notes: "",
      });
      setTimeout(() => router.push("/admin/clients"), 1200);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg space-y-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-qwerty text-center mb-2">Add New Client</h1>
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}
        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">Name *</label>
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
          <label className="block text-sm font-semibold text-qwerty mb-2">Contact Email</label>
          <input
            name="contact_email"
            type="email"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.contact_email}
            onChange={handleChange}
            placeholder="Email address"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">Contact Phone</label>
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
          <label className="block text-sm font-semibold text-qwerty mb-2">Address</label>
          <input
            name="address"
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-qwerty mb-2">Regular Balance</label>
            <input
              name="regular_balance"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
              value={form.regular_balance}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-qwerty mb-2">Paid Amount</label>
            <input
              name="paid_amount"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
              value={form.paid_amount}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-qwerty mb-2">Notes</label>
          <textarea
            name="notes"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400 resize-none"
            value={form.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-qwerty text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Creating..." : "Add Client"}
        </button>
      </form>
    </div>
  );
}
