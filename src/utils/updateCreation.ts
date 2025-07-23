interface UpdateData {
  title: string;
  content: string;
  update_type: string;
  client_id?: string | null;
  ticket_id?: string | null;
}

export async function createUpdate(updateData: UpdateData) {
  try {
    const response = await fetch("/api/updates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to create update",
        message: result.message || "An error occurred",
      };
    }

    return result;
  } catch (error) {
    console.error("Update creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Failed to create update",
    };
  }
} 