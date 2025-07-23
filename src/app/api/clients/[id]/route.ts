import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin operations
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing environment variables: URL=${!!supabaseUrl}, ServiceKey=${!!supabaseServiceKey}`
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

interface ClientUpdateData {
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  notes?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) 
{
  try {
    const { id: clientId } = await params;
    const updateData: ClientUpdateData = await request.json();
    const supabase = createServiceClient();

    const { data: clientData, error: fetchError } = await supabase
      .from("clients")
      .select("user_id")
      .eq("id", clientId)
      .single();

    if (fetchError || !clientData?.user_id) {
      return NextResponse.json(
        { success: false, error: "Could not find client's user record" },
        { status: 404 }
      );
    }

    const [clientUpdate, userUpdate] = await Promise.all([
      supabase
        .from("clients")
        .update({
          name: updateData.name.trim(),
          contact_phone: updateData.contact_phone?.trim() || null,
          address: updateData.address?.trim() || null,
          contact_email: updateData.contact_email?.trim() || null,
          notes: updateData.notes?.trim() || null,
        })
        .eq("id", clientId)
        .select()
        .single(),

      supabase
        .from("users")
        .update({
          name: updateData.name.trim(),
          phone: updateData.contact_phone?.trim() || null,
        })
        .eq("id", clientData.user_id)
        .select()
        .single(),
    ]);

    if (clientUpdate.error) {
      return NextResponse.json(
        {
          success: false,
          error: `Client update failed: ${clientUpdate.error.message}`,
        },
        { status: 400 }
      );
    }

    if (userUpdate.error) {
      return NextResponse.json(
        {
          success: false,
          error: `User update failed: ${userUpdate.error.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      client: clientUpdate.data,
      user: userUpdate.data,
      message: "Client updated successfully!",
    });
  } catch (error) {
    console.error("Client update error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to update client",
      },
      { status: 500 }
    );
  }
}
