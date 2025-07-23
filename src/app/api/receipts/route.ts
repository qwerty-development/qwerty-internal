import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    console.log("Receipts API: Starting payment creation...");

    const supabase = createServiceClient();
    console.log("Receipts API: Service client created successfully");

    // Get a valid user ID from the users table
    console.log("Receipts API: Fetching a valid user ID...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (usersError || !users) {
      console.error("Receipts API: No users found in database:", usersError);
      return NextResponse.json(
        { error: "No users found in database" },
        { status: 500 }
      );
    }

    const userId = users.id;
    console.log("Receipts API: Using user ID:", userId);

    const body = await request.json();
    console.log("Receipts API: Request body received", body);

    const {
      client_id,
      invoice_id,
      receipt_number,
      payment_date,
      amount,
      payment_method,
    } = body;

    // Validate required fields
    if (
      !client_id ||
      !invoice_id ||
      !receipt_number ||
      !payment_date ||
      !amount ||
      !payment_method
    ) {
      console.log("Receipts API: Missing required fields", {
        client_id: !!client_id,
        invoice_id: !!invoice_id,
        receipt_number: !!receipt_number,
        payment_date: !!payment_date,
        amount: !!amount,
        payment_method: !!payment_method,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Receipts API: Creating receipt...");
    // Create receipt with created_by field
    const { data: receipt, error: createReceiptError } = await supabase
      .from("receipts")
      .insert({
        client_id,
        invoice_id,
        receipt_number,
        payment_date,
        amount: parseFloat(amount),
        payment_method,
        created_by: userId,
      })
      .select()
      .single();

    if (createReceiptError) {
      console.error(
        "Receipts API: Receipt creation error:",
        createReceiptError
      );
      return NextResponse.json(
        { error: `Failed to create receipt: ${createReceiptError.message}` },
        { status: 500 }
      );
    }

    console.log("Receipts API: Receipt created successfully", receipt);

    // Update invoice
    console.log("Receipts API: Fetching invoice for update...");
    const { data: invoice, error: fetchInvoiceError } = await supabase
      .from("invoices")
      .select("amount_paid, total_amount")
      .eq("id", invoice_id)
      .single();

    if (fetchInvoiceError) {
      console.error("Receipts API: Invoice fetch error:", fetchInvoiceError);
      return NextResponse.json(
        { error: `Failed to fetch invoice: ${fetchInvoiceError.message}` },
        { status: 500 }
      );
    }

    console.log("Receipts API: Invoice fetched successfully", invoice);

    const newAmountPaid = (invoice.amount_paid || 0) + parseFloat(amount);
    const newBalanceDue = invoice.total_amount - newAmountPaid;
    const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid";

    console.log("Receipts API: Updating invoice...", {
      newAmountPaid,
      newBalanceDue,
      newStatus,
    });

    const { error: updateInvoiceError } = await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        status: newStatus,
      })
      .eq("id", invoice_id);

    if (updateInvoiceError) {
      console.error("Receipts API: Invoice update error:", updateInvoiceError);
      return NextResponse.json(
        { error: `Failed to update invoice: ${updateInvoiceError.message}` },
        { status: 500 }
      );
    }

    console.log("Receipts API: Invoice updated successfully");

    // Update client balance
    console.log("Receipts API: Fetching client for balance update...");
    const { data: currentClient, error: fetchClientError } = await supabase
      .from("clients")
      .select("paid_amount, regular_balance")
      .eq("id", client_id)
      .single();

    if (!fetchClientError && currentClient) {
      const newPaidAmount =
        (currentClient.paid_amount || 0) + parseFloat(amount);
      const newRegularBalance =
        (currentClient.regular_balance || 0) - parseFloat(amount);

      console.log("Receipts API: Updating client balance...", {
        newPaidAmount,
        newRegularBalance,
      });

      const { error: updateClientError } = await supabase
        .from("clients")
        .update({
          paid_amount: newPaidAmount,
          regular_balance: newRegularBalance,
        })
        .eq("id", client_id);

      if (updateClientError) {
        console.error(
          "Receipts API: Client balance update error:",
          updateClientError
        );
        // Don't fail the entire operation if balance update fails
      } else {
        console.log("Receipts API: Client balance updated successfully");
      }
    } else {
      console.log(
        "Receipts API: Client not found or error fetching client",
        fetchClientError
      );
    }

    console.log("Receipts API: Payment creation completed successfully");
    return NextResponse.json({
      success: true,
      receipt,
      message: "Payment added successfully",
    });
  } catch (error) {
    console.error("Receipts API: Unexpected error:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Receipts API: Error name:", error.name);
      console.error("Receipts API: Error message:", error.message);
      console.error("Receipts API: Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: `Internal server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
