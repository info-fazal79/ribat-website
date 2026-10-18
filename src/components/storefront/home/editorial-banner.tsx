import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";

export function EditorialBanner() {
  return (
    <section className="container mx-auto px-4">
      <div className="relative grid overflow-hidden bg-[linear-gradient(135deg,#1f3b33,#0b1a16)] text-[#f6f1e7] md:grid-cols-2">
        <GeometricPattern color="#d8c08a" opacity={0.16} />
        <div className="relative z-10 flex flex-col justify-center gap-5 p-10 md:p-16">
          <p className="text-[11px] font-medium tracking-[0.35em] text-[#d8c08a] uppercase">Atelier · Made in Dhaka</p>
          <h2 className="text-4xl leading-tight font-medium md:text-6xl">
            The Raw Silk
            <br />
            Collection
          </h2>
          <p className="font-bengali text-base opacity-90">রাজশাহীর সিল্ক, ঢাকার কারিগরের হাতে।</p>
          <p className="max-w-md text-sm leading-relaxed opacity-75">
            Woven in Rajshahi, cut and finished by hand in our Dhaka atelier. Mother-of-pearl buttons, French seams,
            and a fit made for long nights of Taraweeh and mornings of Eid.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link
              href="/products/zayn-raw-silk-panjabi"
              className="group inline-flex h-12 items-center gap-2 bg-[#d8c08a] px-7 text-xs font-semibold tracking-[0.2em] text-[#13231e] uppercase transition hover:bg-[#e6d3a6]"
            >
              Discover Zayn
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="text-xs tracking-wider opacity-70">From ৳4,850 · Limited run of 200</span>
          </div>
        </div>
        <div className="relative min-h-80 md:min-h-[520px]">
          <div className="absolute inset-x-[18%] top-[10%] bottom-0 rounded-t-full border border-[#d8c08a]/40 bg-[linear-gradient(180deg,rgba(216,192,138,0.18),transparent_80%)]" />
          <Silhouette
            category="panjabi"
            fill="#d9c39a"
            stroke="rgba(60,47,25,0.5)"
            className="absolute inset-x-0 bottom-[4%] mx-auto h-[80%] w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
