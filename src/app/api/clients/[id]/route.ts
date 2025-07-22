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
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const updateData: ClientUpdateData = await request.json();
    const supabase = createServiceClient();

    // First, get the client's user_id to update the users table
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

    // Update both clients and users tables atomically
    const [clientUpdate, userUpdate] = await Promise.all([
      // Update clients table
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

      // Update users table
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

    // Check for errors in either update
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

    // Return success with updated data
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
