interface QuotationFormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  totalAmount: string;
  issueDate: string;
  dueDate: string;
}

interface QuotationCreationResult {
  success: boolean;
  error?: string;
  quotation?: any;
}

export async function createQuotation(
  formData: QuotationFormData
): Promise<QuotationCreationResult> {
  try {
    const response = await fetch("/api/quotations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to create quotation",
      };
    }

    return {
      success: true,
      quotation: data.quotation,
    };
  } catch (error) {
    console.error("Error creating quotation:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
