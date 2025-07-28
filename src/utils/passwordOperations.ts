interface PasswordResponse {
  success: boolean;
  password?: string;
  message?: string;
  error?: string;
  email?: string;
}

export async function getClientPassword(
  clientId: string
): Promise<PasswordResponse> {
  try {
    const response = await fetch(`/api/clients/${clientId}/password`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to get password",
      };
    }

    return result;
  } catch (error) {
    console.error("Password retrieval error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
