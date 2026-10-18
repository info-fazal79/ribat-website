import type {
  LandingPageStatus,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
} from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "amber" | "blue" | "violet" | "green" | "red" | "slate";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-foreground/80 ring-border",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusPill({ tone, children, dot = true }: { tone: Tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset",
        tones[tone],
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export const orderStatusTone: Record<OrderStatus, Tone> = {
  PENDING: "amber",
  PROCESSING: "blue",
  SHIPPED: "violet",
  DELIVERED: "green",
  CANCELLED: "slate",
  RETURNED: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusPill tone={orderStatusTone[status]}>{label(status)}</StatusPill>;
}

const paymentTone: Record<PaymentStatus, Tone> = {
  UNPAID: "neutral",
  PENDING: "amber",
  PAID: "green",
  FAILED: "red",
  REFUNDED: "slate",
  PARTIALLY_REFUNDED: "slate",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  SSLCOMMERZ: "Card (SSLCommerz)",
};

export function PaymentBadge({ status, method }: { status: PaymentStatus; method: PaymentMethod }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusPill tone={paymentTone[status]} dot={false}>
        {label(status)}
      </StatusPill>
      <span className="text-[11px] text-muted-foreground">{method === "COD" ? "COD" : paymentMethodLabel[method]}</span>
    </div>
  );
}

export function SourceBadge({ source }: { source: OrderSource }) {
  const map: Record<OrderSource, [Tone, string]> = {
    STOREFRONT: ["neutral", "Storefront"],
    LANDING_PAGE: ["violet", "Landing page"],
    ADMIN: ["slate", "Manual"],
  };
  const [tone, text] = map[source];
  return (
    <StatusPill tone={tone} dot={false}>
      {text}
    </StatusPill>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const tone: Record<ProductStatus, Tone> = { ACTIVE: "green", DRAFT: "amber", ARCHIVED: "slate" };
  return <StatusPill tone={tone[status]}>{label(status)}</StatusPill>;
}

export function LandingStatusBadge({ status }: { status: LandingPageStatus }) {
  const tone: Record<LandingPageStatus, Tone> = { PUBLISHED: "green", DRAFT: "amber", ARCHIVED: "slate" };
  return <StatusPill tone={tone[status]}>{label(status)}</StatusPill>;
}
