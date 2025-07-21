import React from "react";
import { DollarSign } from "lucide-react";

interface Props {
  balance: number;
  maintenanceDue: number;
  nextPaymentDate: string;
}

const AccountSummary: React.FC<Props> = ({ balance, maintenanceDue, nextPaymentDate }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-glass hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-primary-300/10"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary-800 to-secondary-600 bg-clip-text text-transparent">
            Account Summary
          </h2>
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300">
            <span className="text-secondary-700 font-medium">Total Balance</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-success-600 to-success-500 bg-clip-text text-transparent">
              ${balance.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300">
            <span className="text-secondary-700 font-medium">Maintenance Due</span>
            <span className="text-xl font-bold text-warning-600">
              ${maintenanceDue.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300">
            <span className="text-secondary-700 font-medium">Next Payment</span>
            <span className="text-lg font-semibold text-secondary-800">
              {nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;