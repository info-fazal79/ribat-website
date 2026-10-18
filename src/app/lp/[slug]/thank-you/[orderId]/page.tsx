import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Banknote, CheckCircle2, MapPin, Phone, Truck } from "lucide-react";
import { GeometricPattern } from "@/components/storefront/art";
import { FacebookPixel, PixelPurchase } from "@/components/landing/facebook-pixel";
import { PrintButton } from "@/components/landing/print-button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { formatBDTBn, toBnDigits } from "@/lib/money";
import { getLandingOrderReceipt } from "@/server/services/orders";

export const metadata: Metadata = { title: "ধন্যবাদ — অর্ডার সম্পন্ন", robots: { index: false, follow: false } };

export default function ThankYouPage({ params }: PageProps<"/lp/[slug]/thank-you/[orderId]">) {
  return (
    <main className="flex-1 bg-[linear-gradient(180deg,#f4efe6,#ebe3d4)] font-bengali">
      <Suspense fallback={<Skeleton className="mx-auto my-16 h-[600px] max-w-xl rounded-3xl" />}>
        <Receipt params={params} />
      </Suspense>
    </main>
  );
}

async function Receipt({ params }: Pick<PageProps<"/lp/[slug]/thank-you/[orderId]">, "params">) {
  const { slug, orderId } = await params;
  const order = await getLandingOrderReceipt(orderId, slug);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:py-16">
      {order.facebookPixelId && (
        <>
          <FacebookPixel pixelId={order.facebookPixelId} />
          <PixelPurchase orderNumber={order.orderNumber} value={order.total} />
        </>
      )}
      <div className="relative overflow-hidden rounded-t-3xl bg-[radial-gradient(120%_100%_at_50%_0%,#24463c,#0b1a16)] px-6 py-10 text-center text-[#f6f1e7]">
        <GeometricPattern color="#d8c08a" opacity={0.14} />
        <div className="relative">
          <span className="mx-auto grid size-16 animate-in zoom-in-50 place-items-center rounded-full bg-[#d8c08a] text-[#13231e] shadow-lg duration-500">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="mt-5 font-bengali text-2xl font-bold md:text-3xl">ধন্যবাদ, {order.customerName}!</h1>
          <p className="mt-2 text-[#f6f1e7]/80">আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।</p>
          <p className="mt-4 inline-block rounded-full bg-[#f6f1e7]/10 px-4 py-1.5 font-sans text-sm tracking-wider ring-1 ring-[#d8c08a]/40">
            অর্ডার নং: <strong>{order.orderNumber}</strong>
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-b-3xl bg-card p-6 shadow-xl md:p-8">
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
          {order.thankYouMessage ?? "আমাদের প্রতিনিধি শীঘ্রই আপনাকে কল করে অর্ডারটি কনফার্ম করবেন। অনুগ্রহ করে ফোনটি কাছে রাখুন।"}
        </p>

        <section>
          <h2 className="mb-3 font-bengali text-base font-semibold">ইনভয়েস</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {order.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium">{i.name}</p>
                    {i.variant && <p className="text-xs text-muted-foreground">{i.variant}</p>}
                  </td>
                  <td className="py-2.5 text-center text-muted-foreground">× {toBnDigits(i.quantity)}</td>
                  <td className="py-2.5 text-right font-sans font-medium">{formatBDTBn(i.lineTotal)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="py-2.5 text-muted-foreground">
                  ডেলিভারি চার্জ
                </td>
                <td className="py-2.5 text-right font-sans">{order.shippingFee ? formatBDTBn(order.shippingFee) : "ফ্রি"}</td>
              </tr>
              <tr className="text-base font-bold">
                <td colSpan={2} className="pt-3">
                  সর্বমোট (ক্যাশ অন ডেলিভারি)
                </td>
                <td className="pt-3 text-right font-sans text-xl">{formatBDTBn(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="grid gap-3 rounded-2xl bg-secondary/70 p-4 text-sm">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {order.addressLine}
          </p>
          <p className="flex items-center gap-2 font-sans">
            <Phone className="size-4 shrink-0 text-primary" /> {order.customerPhone}
          </p>
          {order.zone && (
            <p className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-primary" /> {order.zone.name}
              {order.zone.estimatedDays && ` · আনুমানিক ${toBnDigits(order.zone.estimatedDays)}`}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Banknote className="size-4 shrink-0 text-primary" /> পণ্য হাতে পেয়ে {formatBDTBn(order.total)} পরিশোধ করুন
          </p>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          অর্ডারের সময়: <span className="font-sans">{formatDateTime(order.createdAt)}</span>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row print:hidden">
          <PrintButton />
          <Link
            href="/"
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            আরও কেনাকাটা করুন
          </Link>
        </div>
      </div>
    </div>
  );
}
