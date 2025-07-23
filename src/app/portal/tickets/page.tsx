"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import TicketList from "../../../../components/portal/TicketList";

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

export default function PortalTicketsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/signin");
        return;
      }

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!client) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tickets")
        .select("id, client_id, title, description, page, file_url, status, created_at, viewed")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTickets(data as Ticket[]);
      }
      setLoading(false);
    };

    fetchTickets();
  }, [supabase, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-qwerty mb-8">Your Tickets</h1>
      <TicketList tickets={tickets} />
    </div>
  );
} 