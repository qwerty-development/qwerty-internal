import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRandomPassword } from "@/utils/passwordGenerator";

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

interface ClientData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const clientData: ClientData = await request.json();
    const supabase = createServiceClient();

    // 1. Generate random password
    const password = generateRandomPassword(12);

    // 2. Create Supabase Auth user (requires service role)
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: clientData.email,
        password: password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { success: false, error: `Auth creation failed: ${authError.message}` },
        { status: 400 }
      );
    }

    // 3. Create user record
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        role: "client",
        name: clientData.name,
        phone: clientData.phone || null,
      })
      .select()
      .single();

    if (userError) {
      // Rollback auth user if user record creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        {
          success: false,
          error: `User record creation failed: ${userError.message}`,
        },
        { status: 400 }
      );
    }

    // 4. Create client record
    const { data: clientRecord, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: clientData.name,
        contact_email: clientData.email,
        contact_phone: clientData.phone || null,
        address: clientData.address || null,
        notes: clientData.notes || null,
        user_id: authUser.user.id,
      })
      .select()
      .single();

    if (clientError) {
      // Rollback both auth user and user record if client creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from("users").delete().eq("id", authUser.user.id);
      return NextResponse.json(
        {
          success: false,
          error: `Client record creation failed: ${clientError.message}`,
        },
        { status: 400 }
      );
    }

    // 5. Return success with password
    return NextResponse.json({
      success: true,
      password: password,
      user: authUser.user,
      client: clientRecord,
      message: "Client created successfully!",
    });
  } catch (error) {
    console.error("Client creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to create client",
      },
      { status: 500 }
    );
  }
}
