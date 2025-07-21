import React from "react";
import { DollarSign } from "lucide-react";

interface Props {
  balance: number;
  maintenanceDue: number;
  nextPaymentDate: string;
}

const AccountSummary: React.FC<Props> = ({ balance, maintenanceDue, nextPaymentDate }) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl mb-8">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-qwerty">Maintenance & Balance</h2>
          <div className="p-2 rounded-xl bg-qwerty text-white shadow-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-gray-700 font-medium">Total Balance</span>
            <span className="text-2xl font-bold text-qwerty">
              ${balance.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-gray-700 font-medium">Maintenance Due</span>
            <span className="text-xl font-bold text-qwerty">
              ${maintenanceDue.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-gray-700 font-medium">Next Payment</span>
            <span className="text-lg font-semibold text-gray-800">
              {nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;