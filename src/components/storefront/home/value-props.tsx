import { Banknote, Gem, RefreshCw, Truck } from "lucide-react";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/cart/store";
import { formatBDT } from "@/lib/money";

const items = [
  {
    icon: Truck,
    title: "Free Delivery",
    body: `On orders over ${formatBDT(FREE_DELIVERY_THRESHOLD)}, nationwide`,
    bn: "সারা দেশে ফ্রি ডেলিভারি",
  },
  {
    icon: RefreshCw,
    title: "7 Days Exchange",
    body: "Easy size & colour exchange, no questions",
    bn: "৭ দিনের সহজ এক্সচেঞ্জ",
  },
  {
    icon: Gem,
    title: "Premium Quality",
    body: "Hand-finished fabrics, quality checked twice",
    bn: "প্রিমিয়াম কোয়ালিটি নিশ্চিত",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    body: "Pay at your door — or bKash / Nagad",
    bn: "ক্যাশ অন ডেলিভারি",
  },
];

export function ValueProps() {
  return (
    <section className="border-y bg-secondary/60">
      <div className="container mx-auto grid grid-cols-2 px-4 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body, bn }, i) => (
          <div
            key={title}
            className={`flex flex-col items-center gap-3 px-4 py-8 text-center md:flex-row md:text-left ${i > 0 ? "lg:border-l" : ""} ${i % 2 === 1 ? "border-l lg:border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""}`}
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold/50 text-primary">
              <Icon className="size-5" strokeWidth={1.5} />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase">{title}</p>
              <p className="text-xs text-muted-foreground">{body}</p>
              <p className="font-bengali text-[11px] text-muted-foreground/80">{bn}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
