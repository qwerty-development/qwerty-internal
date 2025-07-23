import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      description,
      totalAmount,
      issueDate,
      dueDate,
    } = body;

    // Validate required fields
    if (!clientName || !description || !totalAmount || !issueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the authenticated user (admin)
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Generate quotation number (similar to invoice numbering)
    const { data: lastQuotation } = await supabase
      .from("quotations")
      .select("quotation_number")
      .order("quotation_number", { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastQuotation && lastQuotation.length > 0) {
      const lastNumber = parseInt(
        lastQuotation[0].quotation_number.replace("Q", "")
      );
      nextNumber = lastNumber + 1;
    }

    const quotationNumber = `Q${nextNumber.toString().padStart(3, "0")}`;

    // Create the quotation
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .insert({
        quotation_number: quotationNumber,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        description,
        total_amount: parseFloat(totalAmount),
        issue_date: issueDate,
        due_date: dueDate || null,
        status: "Draft",
        created_by: user.id,
        is_converted: false,
      })
      .select()
      .single();

    if (quotationError) {
      console.error("Error creating quotation:", quotationError);
      return NextResponse.json(
        { error: "Failed to create quotation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quotation,
    });
  } catch (error) {
    console.error("Error in quotation creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
