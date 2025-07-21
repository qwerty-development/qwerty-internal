import React from "react";
import { Bell, Calendar } from "lucide-react";

interface Update {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Props {
  updates: Update[];
}

const UpdatesSection: React.FC<Props> = ({ updates }) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="p-8">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No updates yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map(update => (
              <div 
                key={update.id} 
                className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all duration-300"
              >
                <div className="font-semibold text-qwerty mb-2">{update.title}</div>
                <div className="text-gray-700 text-sm mb-3 line-clamp-2">{update.content}</div>
                <div className="text-gray-400 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(update.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesSection;