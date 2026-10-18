import type { PaymentMethod } from "@/generated/prisma/enums";

/**
 * Contract every online gateway (bKash, Nagad, SSLCommerz) implements.
 * COD needs no provider — orders are created with paymentStatus UNPAID.
 */
export interface InitiatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: string; // Decimal as string — never a float
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  callbackUrl: string; // absolute URL the gateway redirects back to
}

export interface InitiatePaymentResult {
  redirectUrl: string;
  gatewayReference: string; // paymentID / sessionkey / tran_id
}

export interface VerifyPaymentResult {
  status: "PAID" | "FAILED" | "PENDING";
  transactionId?: string;
  amount?: string;
  raw: unknown; // stored in Payment.gatewayResponse
}

export interface PaymentProvider {
  readonly method: Exclude<PaymentMethod, "COD">;
  isConfigured(): boolean;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  /** Called from the callback/IPN route — must verify with the gateway, never trust query params. */
  verify(params: Record<string, string>): Promise<VerifyPaymentResult>;
  refund?(transactionId: string, amount: string, reason?: string): Promise<VerifyPaymentResult>;
}
