import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { removePasswordFromDatabase } from "@/utils/passwordService";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient();

  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

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

    // Get file URLs before deletion for cleanup
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

    // Delete related records in order (respecting foreign key constraints)

    // 1. Delete tickets
    const { error: ticketsError } = await supabase
      .from("tickets")
      .delete()
      .eq("client_id", clientId);

    if (ticketsError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete tickets: ${ticketsError.message}`,
        },
        { status: 500 }
      );
    }

    // 2. Delete receipts
    const { error: receiptsError } = await supabase
      .from("receipts")
      .delete()
      .eq("client_id", clientId);

    if (receiptsError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete receipts: ${receiptsError.message}`,
        },
        { status: 500 }
      );
    }

    // 3. Delete invoices
    const { error: invoicesError } = await supabase
      .from("invoices")
      .delete()
      .eq("client_id", clientId);

    if (invoicesError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete invoices: ${invoicesError.message}`,
        },
        { status: 500 }
      );
    }

    // 4. Delete quotations (these will cascade due to foreign key constraint)
    const { error: quotationsError } = await supabase
      .from("quotations")
      .delete()
      .eq("client_id", clientId);

    if (quotationsError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete quotations: ${quotationsError.message}`,
        },
        { status: 500 }
      );
    }

    // 5. Delete updates (these have NO ACTION constraint, so we need to handle them manually)
    const { error: updatesError } = await supabase
      .from("updates")
      .delete()
      .eq("client_id", clientId);

    if (updatesError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete updates: ${updatesError.message}`,
        },
        { status: 500 }
      );
    }

    // 6. Delete user record
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", client.user_id);

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete user: ${userError.message}`,
        },
        { status: 500 }
      );
    }

    // 7. Delete client record
    const { error: clientDeleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (clientDeleteError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete client: ${clientDeleteError.message}`,
        },
        { status: 500 }
      );
    }

    // 8. Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(
      client.user_id
    );

    if (authError) {
      console.warn("Failed to delete auth user:", authError.message);
      // Don't return error here as the database records are already deleted
    }

    // 9. Remove password from storage
    const passwordRemoved = await removePasswordFromDatabase(clientId);
    if (!passwordRemoved) {
      console.warn("Failed to remove password from storage for client:", clientId);
    }

    // 10. Delete files from storage (if storage is set up)
    if (fileUrls.length > 0) {
      try {
        // This will work once you set up Supabase Storage buckets
        for (const fileUrl of fileUrls) {
          // Extract file path from URL
          const filePath = fileUrl.split("/").pop(); // Get filename
          if (filePath) {
            const { error: storageError } = await supabase.storage
              .from("uploads") // Replace with your actual bucket name
              .remove([filePath]);

            if (storageError) {
              console.warn(
                `Failed to delete file ${filePath}:`,
                storageError.message
              );
            }
          }
        }
      } catch (storageError) {
        console.warn("Storage deletion failed:", storageError);
        // Don't return error as database deletion was successful
      }
    }

    return NextResponse.json({
      success: true,
      message: "Client and all related data deleted successfully",
      summary: {
        company_name: client.company_name,
        files_deleted: fileUrls.length,
      },
    });
  } catch (error) {
    console.error("Client deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to delete client",
      },
      { status: 500 }
    );
  }
}
