import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRandomPassword } from "@/utils/passwordGenerator";
import { storePassword } from "@/utils/passwordCache";

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
  company_name?: string;
  company_email?: string;
}

interface ClientCreateData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  company_name?: string;
  company_email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const clientData: ClientCreateData = await request.json();
    const supabase = createServiceClient();

    // Validate required fields
    if (!clientData.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!clientData.email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Generate a random password
    const password = generateRandomPassword(12);

    // Create Supabase Auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: clientData.email.trim(),
        password: password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create user: ${authError.message}`,
        },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { success: false, error: "Failed to create auth user" },
        { status: 500 }
      );
    }

    // Create user profile in users table
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        name: clientData.name.trim(),
        phone: clientData.phone?.trim() || null,
        role: "client",
      })
      .select()
      .single();

    if (userError) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.error("User profile creation error:", userError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create user profile: ${userError.message}`,
        },
        { status: 400 }
      );
    }

    // Create client record
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: clientData.name.trim(),
        contact_email: clientData.email.trim(),
        contact_phone: clientData.phone?.trim() || null,
        address: clientData.address?.trim() || null,
        notes: clientData.notes?.trim() || null,
        company_name: clientData.company_name?.trim() || null,
        company_email: clientData.company_email?.trim() || null,
        user_id: authUser.user.id,
      })
      .select()
      .single();

    if (clientError) {
      // Rollback: delete both auth user and user profile
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from("users").delete().eq("id", authUser.user.id);
      console.error("Client creation error:", clientError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create client: ${clientError.message}`,
        },
        { status: 400 }
      );
    }

    // Store the password in cache for later retrieval
    storePassword(client.id, password, clientData.email.trim());

    return NextResponse.json({
      success: true,
      client,
      user: userProfile,
      password,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = (await params).id;
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
          company_name: updateData.company_name?.trim() || null,
          company_email: updateData.company_email?.trim() || null,
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
