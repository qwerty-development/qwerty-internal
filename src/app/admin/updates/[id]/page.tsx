"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft } from "lucide-react";

export default function UpdateDetailPage() {
  const { id } = useParams();
  const supabase = createClient();
  const router = useRouter();
  const [update, setUpdate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpdate = async () => {
      const { data, error } = await supabase
        .from("updates")
        .select(`*, clients(id,company_name), tickets(id,title)`) // join relations
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setUpdate(data);
      }
      setLoading(false);
    };

    fetchUpdate();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Loading update...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/admin/updates" className="text-blue-600 hover:text-blue-800 flex items-center mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Updates
      </Link>

      <div className="bg-white rounded-lg shadow-md border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{update.title}</h1>
        <div className="mb-4 text-gray-700 whitespace-pre-line">{update.content}</div>
        <div className="text-sm text-gray-500">Type: {update.update_type}</div>
        <div className="text-sm text-gray-500 mt-1">
                      Audience: {update.client_id ? update.clients?.company_name || "-" : "All Customers"}
        </div>
        {update.tickets && (
          <div className="text-sm text-gray-500 mt-1">Attached Ticket: {update.tickets?.title}</div>
        )}
        <div className="text-sm text-gray-400 mt-2">
          Created: {new Date(update.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
} 