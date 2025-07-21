import React from "react";
import { Plus, Upload } from "lucide-react";

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
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TicketForm: React.FC<Props> = ({ 
  onSubmit, 
  loading, 
  error, 
  success, 
  form, 
  onChange, 
  onFileChange 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-qwerty">Create Ticket</h2>
          <div className="p-2 rounded-xl bg-qwerty text-white shadow-lg">
            <Plus className="w-6 h-6" />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-qwerty mb-2">Title</label>
            <input
              name="title"
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
              value={form.title}
              onChange={onChange}
              placeholder="Enter ticket title..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-qwerty mb-2">Description</label>
            <textarea
              name="description"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400 resize-none"
              value={form.description}
              onChange={onChange}
              placeholder="Describe the issue..."
              required
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-qwerty mb-2">Page or Route</label>
            <input
              name="page"
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 placeholder-gray-400"
              value={form.page}
              onChange={onChange}
              placeholder="e.g. /dashboard/settings"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-qwerty mb-2">Attachment (optional)</label>
            <div className="relative">
              <input
                name="file"
                type="file"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-qwerty focus:bg-gray-50 focus:outline-none transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-qwerty hover:file:bg-gray-200"
                onChange={onFileChange}
                accept="*"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
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
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-qwerty text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Submit Ticket
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;