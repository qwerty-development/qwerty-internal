interface InvoiceData {
  client_id: string;
  issue_date: string;
  due_date: string;
  description: string;
  total_amount: number;
  created_by?: string;
}

export async function createInvoice(invoiceData: InvoiceData) {
  try {
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to create invoice",
        message: result.message || "An error occurred",
      };
    }

    return result;
  } catch (error) {
    console.error("Invoice creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Failed to create invoice",
    };
  }
}
