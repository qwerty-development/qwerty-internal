"use client";
import React from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Hash,
} from "lucide-react";

interface ClientProfileProps {
  client: {
    company_name: string;
    company_email?: string;
    contact_person_name?: string;
    contact_person_email?: string;
    contact_phone?: string;
    address?: string;
    mof_number?: string;
    notes?: string;
  };
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-300/5 to-pink-500/10 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
            Company Profile
          </h2>
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="group/card p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 group-hover/card:scale-110 transition-transform duration-300">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover/card:text-gray-900 transition-colors duration-300">
                Company Details
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                  Company Name:
                </span>
                <span className="text-gray-800 font-semibold">
                  {client.company_name}
                </span>
              </div>
              {client.company_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                    Company Email:
                  </span>
                  <span className="text-gray-800">{client.company_email}</span>
                </div>
              )}
              {client.mof_number && (
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                    MOF Number:
                  </span>
                  <span className="text-gray-800 font-mono">
                    {client.mof_number}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-xl"></div>
          </div>

          {/* Contact Person Information */}
          {client.contact_person_name && (
            <div className="group/card p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover/card:scale-110 transition-transform duration-300">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover/card:text-gray-900 transition-colors duration-300">
                  Contact Person
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                    Name:
                  </span>
                  <span className="text-gray-800 font-semibold">
                    {client.contact_person_name}
                  </span>
                </div>
                {client.contact_person_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                      Email:
                    </span>
                    <span className="text-gray-800">
                      {client.contact_person_email}
                    </span>
                  </div>
                )}
                {client.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                      Phone:
                    </span>
                    <span className="text-gray-800">
                      {client.contact_phone}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-xl"></div>
            </div>
          )}

          {/* Address Information */}
          {client.address && (
            <div className="group/card p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 group-hover/card:scale-110 transition-transform duration-300">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover/card:text-gray-900 transition-colors duration-300">
                  Address
                </h3>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <span className="text-gray-800 leading-relaxed">
                  {client.address}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-xl"></div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="group/card p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 group-hover/card:scale-110 transition-transform duration-300">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover/card:text-gray-900 transition-colors duration-300">
                  Notes
                </h3>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                <span className="text-gray-800 leading-relaxed">
                  {client.notes}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-xl"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
