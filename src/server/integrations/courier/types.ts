/**
 * Contract for courier integrations (Steadfast, Pathao).
 * Booking stores courierName + trackingCode on the Order.
 */
export type CourierName = "steadfast" | "pathao";

export interface CreateParcelInput {
  orderNumber: string; // used as merchant invoice / order id
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  district: string;
  area: string;
  codAmount: string; // amount to collect; "0" if prepaid
  weightGrams?: number;
  itemCount: number;
  note?: string;
}

export interface CreateParcelResult {
  consignmentId: string;
  trackingCode: string;
  raw: unknown;
}

export type ParcelStatus =
  | "PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "PARTIAL_DELIVERED"
  | "RETURNED"
  | "CANCELLED"
  | "UNKNOWN";

export interface CourierProvider {
  readonly name: CourierName;
  isConfigured(): boolean;
  createParcel(input: CreateParcelInput): Promise<CreateParcelResult>;
  getStatus(consignmentId: string): Promise<{ status: ParcelStatus; raw: unknown }>;
}
