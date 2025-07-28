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

interface InvoiceItemData {
  title: string;
  description?: string;
  price: number;
}

// GET: Fetch all items for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    const invoiceId = params.id;

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

    // Fetch items for the invoice
    const { data: items, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("position");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      items: items || [],
    });
  } catch (error) {
    console.error("Error fetching invoice items:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice items" },
      { status: 500 }
    );
  }
}

// POST: Add multiple items to an invoice (replaces all existing items)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { items }: { items: InvoiceItemData[] } = await request.json();
    const supabase = createServiceClient();
    const invoiceId = params.id;

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

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.title?.trim()) {
        return NextResponse.json(
          { success: false, error: "Item title is required" },
          { status: 400 }
        );
      }
      if (typeof item.price !== "number" || item.price < 0) {
        return NextResponse.json(
          { success: false, error: "Item price must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // Verify invoice exists
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Delete existing items
    const { error: deleteError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", invoiceId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: "Failed to clear existing items" },
        { status: 400 }
      );
    }

    // Insert new items with sequential positions
    const itemsToInsert = items.map((item, index) => ({
      invoice_id: invoiceId,
      position: index + 1,
      title: item.title.trim(),
      description: item.description?.trim() || null,
      price: item.price,
    }));

    const { data: insertedItems, error: insertError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert)
      .select();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    // Mark invoice as using items system
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ uses_items: true })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Failed to update invoice uses_items flag:", updateError);
    }

    return NextResponse.json({
      success: true,
      items: insertedItems,
      message: "Invoice items saved successfully!",
    });
  } catch (error) {
    console.error("Error saving invoice items:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save invoice items" },
      { status: 500 }
    );
  }
}
