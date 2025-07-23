interface DeletionSummary {
  client: any;
  tickets: number;
  invoices: number;
  receipts: number;
  updates: number;
  files: string[];
}

interface DeletionResult {
  success: boolean;
  error?: string;
  message?: string;
  summary?: DeletionSummary;
}

export async function deleteClientCompletely(
  clientId: string
): Promise<DeletionResult> {
  try {
    const response = await fetch(`/api/clients/${clientId}/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to delete client",
        message: result.message || "An error occurred during deletion",
      };
    }

    return result;
  } catch (error) {
    console.error("Client deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Failed to delete client",
    };
  }
}

export async function getClientDeletionSummary(
  clientId: string
): Promise<DeletionResult> {
  try {
    const response = await fetch(`/api/clients/${clientId}/delete-summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to get deletion summary",
        message: result.message || "An error occurred",
      };
    }

    return result;
  } catch (error) {
    console.error("Deletion summary error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Failed to get deletion summary",
    };
  }
}
