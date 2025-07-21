import React from "react";
import { FileText, CheckCircle, Clock } from "lucide-react";

interface Invoice {
  id: string;
  client_id: string;
  quotation_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  description: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  invoices: Invoice[];
}

const InvoicesSection: React.FC<Props> = ({ invoices }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-glass hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-accent-300/5 to-primary-500/10"></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary-800 to-secondary-600 bg-clip-text text-transparent">
            Invoices
          </h2>
          <div className="p-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map(invoice => (
              <div 
                key={invoice.id} 
                className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 group/item"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-bold text-secondary-800">
                    ${invoice.total_amount.toFixed(2)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    invoice.status === "paid"
                      ? "bg-success-100 text-success-700 border border-success-200"
                      : "bg-warning-100 text-warning-700 border border-warning-200"
                  }`}>
                    {invoice.status === "paid" ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Paid
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Pending
                      </div>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-secondary-600">
                  <span>Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</span>
                  <span>Created: {new Date(invoice.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesSection;