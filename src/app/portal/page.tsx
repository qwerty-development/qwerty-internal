"use client";
import React, { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import AccountSummary from "../../../components/portal/AccountSummary";
import InvoicesSection from "../../../components/portal/InvoicesSection";
import UpdatesSection from "../../../components/portal/UpdatesSection";
import TicketForm from "../../../components/portal/TicketForm";
import { Plus } from "lucide-react";
import TicketList from "../../../components/portal/TicketList";
import { createClient } from "@/utils/supabase/client";

// TypeScript Interfaces
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

interface Update {
  id: string;
  title: string;
  content: string;
  created_at: string;
  update_type: string;
  ticket_id: string | null;
  tickets?: any;
}

interface FormData {
  title: string;
  description: string;
  page: string;
  file: File | null;
}

export default function Dashboard() {
  // State management
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
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

  // User avatar/profile state
  const [user, setUser] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Account summary state
  const [balance, setBalance] = useState<number>(0);
  const [maintenanceDue, setMaintenanceDue] = useState<number>(0);
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("");

  // Auth and role protection
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/signin");
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("id, name, avatar_url, role")
        .eq("id", session.user.id)
        .single();
      if (!error && data) {
        setUser({ ...data, email: session.user.email });
        if (data.role !== "client") {
          router.replace("/admin");
        }
      } else {
        router.replace("/signin");
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  // Fetch tickets for the authenticated user
  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.id) return;

      // First get the client record for this user
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (clientError || !client) {
        setTickets([]);
        return;
      }

      // Then fetch tickets for this client
      const { data, error } = await supabase
        .from("tickets")
        .select("id, client_id, title, description, page, file_url, status, created_at, viewed")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setTickets(data as Ticket[]);
      }
    };
    
    fetchTickets();
  }, [formSuccess, user]);

  // Fetch invoices for the signed-in client only
  useEffect(() => {
    const fetchClientAndInvoices = async () => {
      if (!user?.id) return;

      // 1. Fetch the client record for this user
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (clientError || !client) {
        setInvoices([]);
        setBalance(0);
        setMaintenanceDue(0);
        setNextPaymentDate("");
        return;
      }

      // 2. Fetch invoices for this client
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("id, client_id, quotation_id, invoice_number, issue_date, due_date, description, total_amount, amount_paid, balance_due, status, created_by, created_at, updated_at")
        .eq("client_id", client.id)
        .order("due_date", { ascending: true });

      if (!invoiceError && invoiceData) {
        setInvoices(invoiceData as Invoice[]);

        // Calculate account summary data
        const unpaidInvoices = invoiceData.filter((invoice: Invoice) => invoice.status !== "paid");
        const totalBalance = unpaidInvoices.reduce((sum: number, invoice: Invoice) => sum + invoice.total_amount, 0);

        setBalance(totalBalance);

        if (unpaidInvoices.length > 0) {
          const nextInvoice = unpaidInvoices[0];
          setNextPaymentDate(nextInvoice.due_date);
          setMaintenanceDue(nextInvoice.total_amount);
        } else {
          setNextPaymentDate("");
          setMaintenanceDue(0);
        }
      } else {
        setInvoices([]);
        setBalance(0);
        setMaintenanceDue(0);
        setNextPaymentDate("");
      }
    };

    if (user?.id) {
      fetchClientAndInvoices();
    }
  }, [user]);

  // Fetch latest updates for the signed-in client (client-specific or global)
  useEffect(() => {
    const fetchUpdates = async () => {
      let clientId: string | null = null;

      if (user?.id) {
        const { data: client } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (client) {
          clientId = client.id;
        }
      }

      let query = supabase
        .from("updates")
        .select(
          "id, title, content, created_at, update_type, ticket_id, tickets(id, title, page, status, created_at)"
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      } else {
        query = query.is("client_id", null);
      }

      const { data, error } = await query;

      if (!error && data) {
        setUpdates((data || []) as Update[]);
      }
    };

    fetchUpdates();
  }, [user]);

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
        const fileName = `${Date.now()}.${fileExt}`; // No user_id prefix for public files
        
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
      
      // Fetch the client record for this user
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (clientError || !client) {
        setFormError("Could not find your client record.");
        setFormLoading(false);
        return;
      }
      // Insert ticket into database with client_id
      const { error: insertError } = await supabase
        .from("tickets")
        .insert([
          {
            client_id: client.id,
            title: form.title,
            description: form.description,
            page: form.page,
            file_url: fileUrl,
            status: "pending",
            viewed: false, // Default to false for new tickets
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

  // Add statistics for summary row
  const totalTickets = tickets.length;

  // Only show last 3 updates and tickets
  const latestUpdates = updates.slice(0, 3);
  const latestTickets = tickets.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* User Avatar/Profile */}
      {user && (
        <div className="absolute top-4 right-8 z-50">
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setPanelOpen((open) => !open)}
              aria-label="Open user panel"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-blue-900">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </span>
              )}
            </button>
            {panelOpen && (
              <div
                ref={panelRef}
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-6 z-50 animate-fade-in"
              >
                <div className="flex flex-col items-center mb-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="avatar"
                      className="w-16 h-16 rounded-full object-cover mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-900 mb-2">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="text-lg font-semibold text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Hero/Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#01303F] via-[#014a5f] to-[#01303F] pb-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              QWERTY
              <span className="block text-3xl md:text-4xl font-light text-blue-100 mt-2">
                Client Portal
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Welcome, {user?.name}! Here you can manage your account, view invoices, and submit tickets.
            </p>
          </div>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-300/5 to-primary-500/10"></div>
      <div className="relative p-6 flex flex-col items-center justify-center">
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 mb-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-gray-600 mb-1">Total Tickets</div>
        <div className="text-3xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
          {totalTickets}
        </div>
      </div>
    </div>

    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-300/5 to-green-500/10"></div>
      <div className="relative p-6 flex flex-col items-center justify-center">
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 mb-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div className="text-sm font-medium text-gray-600 mb-1">Outstanding Balance</div>
        <div className="text-3xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
          ${balance.toFixed(2)}
        </div>
      </div>
    </div>

    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-300/5 to-indigo-500/10"></div>
      <div className="relative p-6 flex flex-col items-center justify-center">
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 mb-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-gray-600 mb-1">Next Payment</div>
        <div className="text-3xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
          {nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
        </div>
      </div>
    </div>
  </div>
</div>
      {/* Updates Section - full width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
  <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-xl hover:shadow-3xl transition-all duration-500">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-300/5 to-primary-500/10"></div>
    <div className="relative">
      <div className="flex items-center justify-between p-8 pb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
          Latest Updates
        </h2>
        <a 
          href="/portal/updates" 
          className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          See all updates
        </a>
      </div>
      <div className="px-8 pb-8">
        <UpdatesSection updates={latestUpdates} />
      </div>
    </div>
  </div>
</div>
      {/* Main Content Grid: maintenance left, tickets right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Left: Account Summary */}
    <div>
      <AccountSummary 
        balance={balance} 
        maintenanceDue={maintenanceDue} 
        nextPaymentDate={nextPaymentDate} 
      />
    </div>
    
    {/* Right: Recent Tickets */}
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 shadow-xl hover:shadow-3xl transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-300/5 to-indigo-500/10"></div>
      <div className="relative">
        <div className="flex items-center justify-between p-8 pb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#01303F] to-[#014a5f] bg-clip-text text-transparent">
            Recent Tickets
          </h2>
          <a 
            href="/portal/tickets" 
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold text-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            See all tickets
          </a>
        </div>
        <div className="px-8 pb-8">
          <TicketList tickets={latestTickets} />
        </div>
      </div>
    </div>
  </div>
</div>
// Update the FAB (Floating Action Button):
<button
  className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-[#01303F] to-[#014a5f] text-white flex items-center justify-center shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#01303F]/30 group"
  aria-label="Create Ticket"
  onClick={() => setShowTicketModal(true)}
>
  <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
</button>
// Update the Modal wrapper:
{showTicketModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="relative animate-in fade-in-0 zoom-in-95 duration-300">
      <button
        className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-center text-lg font-bold hover:scale-110 transition-all duration-300 focus:outline-none shadow-lg z-10"
        onClick={() => setShowTicketModal(false)}
        aria-label="Close Ticket Form"
      >
        ×
      </button>
      <div className="max-w-lg w-full mx-4">
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
  </div>
)}
    </div>
  );
}