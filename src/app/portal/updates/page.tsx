"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import UpdatesSection from "../../../../components/portal/UpdatesSection";

interface Update {
  id: string;
  title: string;
  content: string;
  created_at: string;
  update_type: string;
  ticket_id?: string | null;
  tickets?: any;
}

export default function PortalUpdatesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/signin");
        return;
      }

      // Get client id
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      let q = supabase
        .from("updates")
        .select(
          "id, title, content, created_at, update_type, ticket_id, tickets(id, title, page, status, created_at)"
        )
        .order("created_at", { ascending: false });

      if (client) {
        q = q.or(`client_id.eq.${client.id},client_id.is.null`);
      } else {
        q = q.is("client_id", null);
      }

      const { data, error } = await q;
      if (!error && data) {
        setUpdates(data as Update[]);
      }
      setLoading(false);
    };

    fetchUpdates();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-qwerty mb-8">All Updates</h1>
      <UpdatesSection updates={updates} />
    </div>
  );
} 