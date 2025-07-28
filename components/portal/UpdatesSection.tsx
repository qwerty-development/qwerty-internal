// components/portal/UpdatesSection.tsx
'use client'
import React from "react";
import {
  Bell,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Hammer,
  Archive,
} from "lucide-react";

interface Update {
  id: string;
  title: string;
  content: string;
  created_at: string;
  update_type: string;
  ticket_id?: string | null;
  tickets?: {
    id: string;
    title: string;
    page: string;
    status: string;
    created_at: string;
  } | null;
}

interface Props {
  updates: Update[];
}

// Utility to convert absolute timestamp into a human-readable relative time string
const getRelativeTime = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
};

// Map ticket status to styling and icon
const getTicketStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return {
        className: "bg-green-100 text-green-800 border border-green-200",
        icon: CheckCircle,
        label: "Approved",
      };
    case "rejected":
    case "declined":
      return {
        className: "bg-red-100 text-red-800 border border-red-200",
        icon: XCircle,
        label: "Rejected",
      };
    case "working on it":
    case "working":
    case "in progress":
      return {
        className: "bg-blue-100 text-blue-800 border border-blue-200",
        icon: Hammer,
        label: "Working on it",
      };
    case "closed":
      return {
        className: "bg-gray-200 text-gray-800 border border-gray-300",
        icon: Archive,
        label: "Closed",
      };
    default:
      return {
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        icon: Clock,
        label: "Pending",
      };
  }
};

const UpdatesSection: React.FC<Props> = ({ updates }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-glass hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-300/5 to-primary-500/10"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
        </div>
        
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No updates yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="p-6 rounded-xl bg-white/10 backdrop-blur border border-black hover:bg-white/20 transition-all duration-300 group/item"
              >
                {/* Header row with type badge and relative date */}
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase bg-blue-500/20 text-blue-900 px-2 py-0.5 rounded">
                    <Tag className="w-3 h-3" /> {update.update_type}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {getRelativeTime(update.created_at)}
                  </span>
                </div>

                {/* Title */}
                <div className="font-semibold text-xl text-[#01303F] group-hover/item:text-[#014a5f] transition-colors mb-2">
                  {update.title}
                </div>

                {/* Description */}
                <div className="text-gray-700 text-sm leading-relaxed mb-1 line-clamp-3">
                  {update.content}
                </div>

                {update.ticket_id && update.tickets && (
                  <div className="mt-4 border-t border-white/20 pt-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#01303F] mb-1">
                      <FileText className="w-4 h-4" /> Related Ticket
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      {update.tickets.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(update.tickets.created_at).toLocaleDateString()}
                      </span>
                      {(() => {
                        const cfg = getTicketStatusConfig(update.tickets.status);
                        const StatusIcon = cfg.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}
                          >
                            <StatusIcon className="w-3 h-3" /> {cfg.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesSection;