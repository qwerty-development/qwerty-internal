export interface PaymentFormData {
  client_id: string;
  invoice_id: string;
  receipt_number: string;
  payment_date: string;
  amount: string;
  payment_method: string;
}

export async function createPayment(paymentData: PaymentFormData) {
  try {
    const response = await fetch("/api/receipts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create payment");
    }

    return result;
  } catch (error) {
    console.error("Payment creation error:", error);
    throw error;
  }
}
