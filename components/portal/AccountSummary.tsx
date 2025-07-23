'use client'
// components/portal/AccountSummary.tsx
import React from "react";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";

interface Props {
  balance: number;
  maintenanceDue: number;
  nextPaymentDate: string;
}

const AccountSummary: React.FC<Props> = ({ balance, maintenanceDue, nextPaymentDate }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-glass hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-300/5 to-green-500/10"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
            Account Summary
          </h2>
          <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="group/card p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Total Balance</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
                ${balance.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="group/card p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Maintenance Due</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
                ${maintenanceDue.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="group/card p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Next Payment</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">
                {nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;
