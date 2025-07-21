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
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-glass hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-300/10 via-primary-200/5 to-success-500/10"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary-800 to-secondary-600 bg-clip-text text-transparent">
            Latest Updates
          </h2>
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {updates.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No updates yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map(update => (
              <div 
                key={update.id} 
                className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 group/item"
              >
                <div className="font-semibold text-secondary-800 mb-2">{update.title}</div>
                <div className="text-secondary-600 text-sm mb-3 line-clamp-2">{update.content}</div>
                <div className="text-secondary-400 text-xs flex items-center gap-1">
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