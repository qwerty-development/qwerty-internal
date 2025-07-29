interface ClientData {
  company_name: string;
  company_email: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_phone?: string;
  address?: string;
  mof_number?: string;
  notes?: string;
}

export async function createClientUser(clientData: ClientData) {
  try {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clientData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to create client",
        message: result.message || "An error occurred",
      };
    }

    return result;
  } catch (error) {
    console.error("Client creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Failed to create client",
    };
  }
}
