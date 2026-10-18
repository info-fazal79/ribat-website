/**
 * BDT money helpers. Prices are Decimal(12,2) in the DB — never do
 * float arithmetic on them server-side; use Prisma.Decimal there.
 * These helpers are for display only.
 */
type MoneyInput = number | string | { toString(): string } | null | undefined;

// Bangladesh uses lakh/crore grouping (1,00,000), same as en-IN.
const bdtFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function toNumber(value: MoneyInput): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/** formatBDT(1450) → "৳1,450" · formatBDT(125000) → "৳1,25,000" */
export function formatBDT(value: MoneyInput): string {
  return `৳${bdtFormatter.format(toNumber(value))}`;
}

/** Percentage saved vs. compare-at price, rounded. Returns 0 if no discount. */
export function discountPercent(price: MoneyInput, compareAt: MoneyInput): number {
  const p = toNumber(price);
  const c = toNumber(compareAt);
  if (c <= 0 || p >= c) return 0;
  return Math.round(((c - p) / c) * 100);
}
