// components/portal/TicketForm.tsx
"use client";
import React from "react";
import { Plus, Upload, Send } from "lucide-react";

interface FormData {
  title: string;
  description: string;
  page: string;
  file: File | null;
}

interface Props {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  form: FormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TicketForm: React.FC<Props> = ({
  onSubmit,
  loading,
  error,
  success,
  form,
  onChange,
  onFileChange,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/95 via-white/90 to-white/85 border border-white/20 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-300/5 to-blue-500/5"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
            Create Support Ticket
          </h2>
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent mb-2">
              Title *
            </label>
            <input
              name="title"
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur border border-gray-200/60 focus:border-[#01303F] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#01303F]/20 transition-all duration-300 placeholder-gray-400"
              value={form.title}
              onChange={onChange}
              placeholder="Enter ticket title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent mb-2">
              Description *
            </label>
            <textarea
              name="description"
              className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur border border-gray-200/60 focus:border-[#01303F] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#01303F]/20 transition-all duration-300 placeholder-gray-400 resize-none"
              value={form.description}
              onChange={onChange}
              placeholder="Describe the issue in detail..."
              required
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent mb-2">
              Page or Route *
            </label>
            <input
              name="page"
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur border border-gray-200/60 focus:border-[#01303F] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#01303F]/20 transition-all duration-300 placeholder-gray-400"
              value={form.page}
              onChange={onChange}
              placeholder="e.g. /dashboard/settings"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent mb-2">
              Attachment (optional)
            </label>
            <div className="relative">
              <input
                name="file"
                type="file"
                className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur border border-gray-200/60 focus:border-[#01303F] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#01303F]/20 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-gray-100 file:to-gray-200 file:text-[#01303F] hover:file:from-gray-200 hover:file:to-gray-300"
                onChange={onFileChange}
                accept="*"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 backdrop-blur">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 backdrop-blur">
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#01303F] to-[#014a5f] text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group/btn relative overflow-hidden"
            disabled={loading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-purple-400/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
            {loading ? (
              <div className="flex items-center justify-center gap-3 relative z-10">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 relative z-10">
                <Send className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300 group-hover/btn:scale-110" />
                <span>Submit Support Ticket</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
