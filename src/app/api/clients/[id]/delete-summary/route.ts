import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    const supabase = createServiceClient();

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError) {
      return NextResponse.json(
        { success: false, error: `Database error: ${clientError.message}` },
        { status: 500 }
      );
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // Get counts of related records
    const [
      { count: ticketsCount },
      { count: invoicesCount },
      { count: receiptsCount },
    ] = await Promise.all([
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("receipts")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId),
    ]);

    // Get file URLs that will need to be deleted
    const fileUrls: string[] = [];

    // Get ticket files
    const { data: ticketFiles } = await supabase
      .from("tickets")
      .select("file_url")
      .eq("client_id", clientId)
      .not("file_url", "is", null);

    if (ticketFiles) {
      ticketFiles.forEach((ticket) => {
        if (ticket.file_url) {
          fileUrls.push(ticket.file_url);
        }
      });
    }

    const summary = {
      client,
      tickets: ticketsCount || 0,
      invoices: invoicesCount || 0,
      receipts: receiptsCount || 0,
      updates: 0,
      files: fileUrls,
    };

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to get deletion summary",
      },
      { status: 500 }
    );
  }
}
