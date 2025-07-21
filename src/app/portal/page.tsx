"use client";
import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AccountSummary from "../components/portal/AccountSummary";
import InvoicesSection from "../components/portal/InvoicesSection";
import UpdatesSection from "../components/portal/UpdatesSection";
import TicketForm from "../components/portal/TicketForm";
import { Plus } from "lucide-react";

// TypeScript Interfaces
interface Ticket {
  id: string;
  title: string;
  description: string;
  page: string;
  file_url: string | null;
  status: string;
  created_at: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface Update {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface FormData {
  title: string;
  description: string;
  page: string;
  file: File | null;
}

export default function Dashboard() {
  // State management
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    page: "",
    file: null,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const router = useRouter();
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Account summary state
  const [balance, setBalance] = useState<number>(0);
  const [maintenanceDue, setMaintenanceDue] = useState<number>(0);
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("");

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
      } else {
        setAuthenticated(true);
        setUserId(data.session.user.id);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // Fetch tickets for the authenticated user
  useEffect(() => {
    if (!userId) return;
    
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, title, description, page, file_url, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setTickets(data as Ticket[]);
      }
    };
    
    fetchTickets();
  }, [userId, formSuccess]);

  // Fetch invoices for the authenticated user
  useEffect(() => {
    if (!userId) return;
    
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount, status, due_date, created_at")
        .eq("user_id", userId)
        .order("due_date", { ascending: true });
      
      if (!error && data) {
        setInvoices(data as Invoice[]);
        
        // Calculate account summary data
        const unpaidInvoices = data.filter((invoice: Invoice) => invoice.status !== "paid");
        const totalBalance = unpaidInvoices.reduce((sum: number, invoice: Invoice) => sum + invoice.amount, 0);
        
        setBalance(totalBalance);
        
        if (unpaidInvoices.length > 0) {
          const nextInvoice = unpaidInvoices[0];
          setNextPaymentDate(nextInvoice.due_date);
          setMaintenanceDue(nextInvoice.amount);
        } else {
          setNextPaymentDate("");
          setMaintenanceDue(0);
        }
      }
    };
    
    fetchInvoices();
  }, [userId]);

  // Fetch latest updates (global, not user-specific)
  useEffect(() => {
    const fetchUpdates = async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("id, title, content, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (!error && data) {
        setUpdates(data as Update[]);
      }
    };
    
    fetchUpdates();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prevForm => ({ ...prevForm, [name]: value }));
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm(prevForm => ({ ...prevForm, file: e.target.files![0] }));
    }
  };

  // Handle ticket form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    
    let fileUrl = null;
    
    try {
      // Upload file if present
      if (form.file) {
        const fileExt = form.file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("ticket-files")
          .upload(fileName, form.file);
        
        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }
        
        const { data: urlData } = supabase.storage
          .from("ticket-files")
          .getPublicUrl(fileName);
        
        fileUrl = urlData.publicUrl;
      }
      
      // Insert ticket into database
      const { error: insertError } = await supabase
        .from("tickets")
        .insert([
          {
            user_id: userId,
            title: form.title,
            description: form.description,
            page: form.page,
            file_url: fileUrl,
            status: "pending",
          },
        ]);
      
      if (insertError) {
        throw new Error(`Ticket creation failed: ${insertError.message}`);
      }
      
      // Success - reset form and show success message
      setFormSuccess("Ticket created successfully!");
      setForm({ title: "", description: "", page: "", file: null });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/20 to-pink-100/30"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Dashboard
            </h1>
            <p className="text-xl text-gray-600">Manage your account and services</p>
          </div>
          
          {/* Top Grid - Account Summary, Invoices, Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <AccountSummary 
              balance={balance} 
              maintenanceDue={maintenanceDue} 
              nextPaymentDate={nextPaymentDate} 
            />
            <InvoicesSection invoices={invoices} />
            <UpdatesSection updates={updates} />
          </div>
          
          {/* Bottom Grid - Ticket List only (form is now in modal) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div />
            <TicketList tickets={tickets} />
          </div>
        </div>
      </div>
      {/* FAB */}
      <button
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-darkblue text-white flex items-center justify-center shadow-2xl hover:bg-primary-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-300"
        aria-label="Create Ticket"
        onClick={() => setShowTicketModal(true)}
      >
        <Plus className="w-8 h-8" />
      </button>
      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl font-bold focus:outline-none"
              onClick={() => setShowTicketModal(false)}
              aria-label="Close Ticket Form"
            >
              &times;
            </button>
            <TicketForm
              onSubmit={handleSubmit}
              loading={formLoading}
              error={formError}
              success={formSuccess}
              form={form}
              onChange={handleChange}
              onFileChange={handleFileChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}