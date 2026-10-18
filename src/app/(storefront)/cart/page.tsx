import type { Metadata } from "next";
import { CartView } from "@/components/storefront/cart-view";
import { PageBanner } from "@/components/storefront/page-banner";

export const metadata: Metadata = { title: "Your Bag", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageBanner title="Your Bag" titleBn="আপনার ব্যাগ" crumbs={[{ title: "Bag" }]} />
      <section className="container mx-auto px-4 py-12">
        <CartView />
      </section>
    </>
  );
}
