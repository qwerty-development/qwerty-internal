import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

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

interface QuotationItemData {
  title: string;
  description?: string;
  price: number;
}

interface QuotationData {
  // Client data (for new client mode)
  company_name?: string;
  company_email?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_phone?: string;
  address?: string;
  mof_number?: string;
  notes?: string;

  // Existing client reference (for existing client mode)
  client_id?: string;

  // Quotation data
  description: string;
  terms_and_conditions?: string;
  quotationIssueDate: string;
  quotationDueDate?: string;
  totalAmount?: number;
  items?: QuotationItemData[];
}

// Generate next quotation number
async function getNextQuotationNumber(supabase: any): Promise<string> {
  const { data: lastQuotation, error } = await supabase
    .from("quotations")
    .select("quotation_number")
    .order("quotation_number", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to get last quotation number: ${error.message}`);
  }

  if (!lastQuotation) {
    return "Q001";
  }

  // Extract number from last quotation number (e.g., "Q001" -> 1)
  const match = lastQuotation.quotation_number.match(/Q(\d+)/);
  if (!match) {
    return "Q001";
  }

  const lastNumber = parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;
  return `Q${nextNumber.toString().padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const quotationData: QuotationData = await request.json();
    const supabase = createServiceClient();

    // Get the current authenticated user
    const supabaseServer = await createServerClient();
    const {
      data: { session },
    } = await supabaseServer.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Determine the mode: new client or existing client
    const isNewClientMode =
      !quotationData.client_id && quotationData.company_name;
    const isExistingClientMode =
      quotationData.client_id && !quotationData.company_name;

    if (!isNewClientMode && !isExistingClientMode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Either provide client_id for existing client or company_name for new client",
        },
        { status: 400 }
      );
    }

    // Validate based on mode
    if (isNewClientMode) {
      // Validate required fields for new client mode
      if (!quotationData.company_name?.trim()) {
        return NextResponse.json(
          { success: false, error: "Company name is required" },
          { status: 400 }
        );
      }

      if (!quotationData.company_email?.trim()) {
        return NextResponse.json(
          { success: false, error: "Company email is required" },
          { status: 400 }
        );
      }
    } else {
      // Validate existing client exists
      const { data: existingClient, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("id", quotationData.client_id)
        .single();

      if (clientError || !existingClient) {
        return NextResponse.json(
          { success: false, error: "Selected client not found" },
          { status: 400 }
        );
      }
    }

    // Validate quotation fields
    if (!quotationData.description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }

    if (!quotationData.quotationIssueDate) {
      return NextResponse.json(
        { success: false, error: "Issue date is required" },
        { status: 400 }
      );
    }

    // Determine if using items system
    const usingItems = quotationData.items && quotationData.items.length > 0;
    let totalAmount = 0;

    if (usingItems) {
      // Validate items
      if (
        !Array.isArray(quotationData.items) ||
        quotationData.items.length === 0
      ) {
        return NextResponse.json(
          { success: false, error: "At least one item is required" },
          { status: 400 }
        );
      }

      for (const item of quotationData.items) {
        if (!item.title?.trim()) {
          return NextResponse.json(
            { success: false, error: "Item title is required" },
            { status: 400 }
          );
        }
        if (typeof item.price !== "number" || item.price < 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Item price must be a non-negative number",
            },
            { status: 400 }
          );
        }
      }

      // Calculate total from items
      totalAmount = quotationData.items.reduce(
        (sum, item) => sum + item.price,
        0
      );
    } else {
      // Use provided total amount (legacy system)
      if (!quotationData.totalAmount || quotationData.totalAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Total amount must be greater than 0" },
          { status: 400 }
        );
      }
      totalAmount = quotationData.totalAmount;
    }

    // Get next quotation number
    const quotationNumber = await getNextQuotationNumber(supabase);

    // Prepare quotation data based on mode
    const quotationInsertData: any = {
      // Quotation data
      description: quotationData.description.trim(),
      terms_and_conditions: quotationData.terms_and_conditions?.trim() || null,
      quotation_issue_date: quotationData.quotationIssueDate,
      quotation_due_date: quotationData.quotationDueDate || null,
      total_amount: totalAmount,

      // Keep the old fields for backward compatibility (set them to the same values)
      issue_date: quotationData.quotationIssueDate,
      due_date: quotationData.quotationDueDate || null,

      // Quotation-specific
      quotation_number: quotationNumber,
      status: "Draft",
      uses_items: usingItems,
      is_converted: false,
      created_by: session.user.id,
    };

    // Add client data based on mode
    if (isNewClientMode) {
      // New client mode - include all client data in quotation
      quotationInsertData.company_name = quotationData.company_name?.trim();
      quotationInsertData.company_email = quotationData.company_email?.trim();
      quotationInsertData.contact_person_name =
        quotationData.contact_person_name?.trim() || null;
      quotationInsertData.contact_person_email =
        quotationData.contact_person_email?.trim() || null;
      quotationInsertData.contact_phone =
        quotationData.contact_phone?.trim() || null;
      quotationInsertData.address = quotationData.address?.trim() || null;
      quotationInsertData.mof_number = quotationData.mof_number?.trim() || null;
      quotationInsertData.notes = quotationData.notes?.trim() || null;
      // client_id will be null for new client mode
    } else {
      // Existing client mode - set client_id and populate client data from existing client
      quotationInsertData.client_id = quotationData.client_id;

      // Fetch existing client data to populate quotation fields for display
      const { data: existingClient } = await supabase
        .from("clients")
        .select(
          "company_name, company_email, contact_person_name, contact_person_email, contact_phone, address, mof_number, notes"
        )
        .eq("id", quotationData.client_id)
        .single();

      if (existingClient) {
        quotationInsertData.company_name = existingClient.company_name;
        quotationInsertData.company_email = existingClient.company_email;
        quotationInsertData.contact_person_name =
          existingClient.contact_person_name;
        quotationInsertData.contact_person_email =
          existingClient.contact_person_email;
        quotationInsertData.contact_phone = existingClient.contact_phone;
        quotationInsertData.address = existingClient.address;
        quotationInsertData.mof_number = existingClient.mof_number;
        quotationInsertData.notes = existingClient.notes;
      }
    }

    // Create quotation with all fields
    const { data: quotationRecord, error: quotationError } = await supabase
      .from("quotations")
      .insert(quotationInsertData)
      .select()
      .single();

    if (quotationError) {
      return NextResponse.json(
        {
          success: false,
          error: `Quotation creation failed: ${quotationError.message}`,
        },
        { status: 400 }
      );
    }

    // If using items, create quotation items
    if (usingItems && quotationData.items) {
      const itemsToInsert = quotationData.items.map((item, index) => ({
        quotation_id: quotationRecord.id,
        position: index + 1,
        title: item.title.trim(),
        description: item.description?.trim() || null,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("quotation_items")
        .insert(itemsToInsert);

      if (itemsError) {
        // Rollback: delete the quotation
        await supabase.from("quotations").delete().eq("id", quotationRecord.id);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create quotation items: ${itemsError.message}`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      quotation: quotationRecord,
      message: "Quotation created successfully!",
    });
  } catch (error) {
    console.error("Quotation creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to create quotation",
      },
      { status: 500 }
    );
  }
}
