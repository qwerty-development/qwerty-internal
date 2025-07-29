interface ClientUpdateData {
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  notes?: string;
  company_name?: string;
  company_email?: string;
}

export async function updateClientUser(
  clientId: string,
  updateData: ClientUpdateData
) {
  try {
    const response = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to update client",
        message: result.message || "An error occurred",
      };
    }

    return result;
  } catch (error) {
    console.error("Client update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Failed to update client",
    };
  }
}
