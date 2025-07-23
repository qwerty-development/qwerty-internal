'use client'
import React from "react";
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Download,
} from "lucide-react";

interface Ticket {
  id: string;
  client_id: string;
  title: string;
  description: string;
  page: string;
  file_url: string | null;
  status: string;
  created_at: string;
  viewed: boolean;
}

interface Props {
  tickets: Ticket[];
}

const TicketList: React.FC<Props> = ({ tickets }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          className:
            "bg-green-100 text-green-800 border border-green-200",
          icon: CheckCircle,
          label: "Approved",
        };
      case "declined":
        return {
          className: "bg-red-100 text-red-800 border border-red-200",
          icon: XCircle,
          label: "Declined",
        };
      default:
        return {
          className:
            "bg-yellow-100 text-yellow-800 border border-yellow-200",
          icon: Clock,
          label: "Pending",
        };
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-glass hover:shadow-3xl transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-success-500/10 via-success-300/5 to-primary-500/10"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary-800 to-secondary-600 bg-clip-text text-transparent">
            Your Tickets
          </h2>
          <div className="p-2 rounded-xl bg-gradient-to-r from-success-500 to-success-600 shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tickets yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const statusConfig = getStatusConfig(ticket.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={ticket.id}
                  className="p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 group/item"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-secondary-800 group-hover/item:text-primary-600 transition-colors">
                      {ticket.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.className}`}
                    >
                      <div className="flex items-center gap-1">
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </div>
                    </span>
                  </div>

                  <p className="text-secondary-700 mb-3 line-clamp-2">
                    {ticket.description}
                  </p>

                  <div className="text-sm text-secondary-600 mb-3">
                    <span className="font-medium">Page:</span> {ticket.page}
                  </div>

                  {ticket.file_url && (
                    <div className="mb-3">
                      <a
                        href={ticket.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        View Attachment
                      </a>
                    </div>
                  )}

                  <div className="text-xs text-secondary-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created: {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
