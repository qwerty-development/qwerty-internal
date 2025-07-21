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
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-glass hover:shadow-3xl transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 via-primary-500/5 to-accent-500/10"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary-800 to-secondary-600 bg-clip-text text-transparent">
            Create Ticket
          </h2>
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Title</label>
            <input
              name="title"
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur border border-white/30 focus:border-primary-400 focus:bg-white/70 focus:outline-none transition-all duration-300 placeholder-secondary-500"
              value={form.title}
              onChange={onChange}
              placeholder="Enter ticket title..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Description</label>
            <textarea
              name="description"
              className="w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur border border-white/30 focus:border-primary-400 focus:bg-white/70 focus:outline-none transition-all duration-300 placeholder-secondary-500 resize-none"
              value={form.description}
              onChange={onChange}
              placeholder="Describe the issue..."
              required
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Page or Route</label>
            <input
              name="page"
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur border border-white/30 focus:border-primary-400 focus:bg-white/70 focus:outline-none transition-all duration-300 placeholder-secondary-500"
              value={form.page}
              onChange={onChange}
              placeholder="e.g. /dashboard/settings"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Attachment (optional)</label>
            <div className="relative">
              <input
                name="file"
                type="file"
                className="w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur border border-white/30 focus:border-primary-400 focus:bg-white/70 focus:outline-none transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                onChange={onFileChange}
                accept="*"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            </div>
          </div>
          
          {error && (
            <div className="p-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-xl bg-success-50 border border-success-200 text-success-700 text-sm">
              {success}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
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