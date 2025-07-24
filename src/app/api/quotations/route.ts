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
  // Client data
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientContactEmail?: string;
  clientContactPhone?: string;
  clientAddress?: string;
  clientNotes?: string;

  // Invoice data
  description: string;
  quotationIssueDate: string;
  quotationDueDate?: string;
  totalAmount?: number;
  items?: QuotationItemData[];

  // Optional existing client reference
  clientId?: string;
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

    // Validate required fields
    if (!quotationData.clientName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Client name is required" },
        { status: 400 }
      );
    }

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

    // Create quotation with all fields
    const { data: quotationRecord, error: quotationError } = await supabase
      .from("quotations")
      .insert({
        // Client data
        client_name: quotationData.clientName.trim(),
        client_email: quotationData.clientEmail?.trim() || null,
        client_phone: quotationData.clientPhone?.trim() || null,
        client_contact_email: quotationData.clientContactEmail?.trim() || null,
        client_contact_phone: quotationData.clientContactPhone?.trim() || null,
        client_address: quotationData.clientAddress?.trim() || null,
        client_notes: quotationData.clientNotes?.trim() || null,

        // Invoice data
        description: quotationData.description.trim(),
        quotation_issue_date: quotationData.quotationIssueDate,
        quotation_due_date: quotationData.quotationDueDate || null,
        total_amount: totalAmount,

        // Quotation-specific
        quotation_number: quotationNumber,
        status: "Draft",
        uses_items: usingItems,
        is_converted: false,
        created_by: session.user.id,
      })
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
